// Génération de vidéos marketing (Runway gen4_turbo) — logique serveur isolée.
// Un seul point d'entrée par étape pour pouvoir changer de fournisseur facilement.
import { buildPrompt, requestImage } from "./visual.server";
import { videoLimitFor } from "./plans";
import { LIMIT_REACHED_MESSAGE } from "./ai-types";

const RUNWAY_API = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";
const RUNWAY_MODEL = "gen4_turbo";
const VIDEO_DURATION = 8;
export const VIDEO_FORMATS = ["vertical", "horizontal"] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];
const FORMAT_SETTINGS: Record<VideoFormat, { image: string; ratio: string }> = {
  vertical: { image: "Portrait (story)", ratio: "720:1280" },
  horizontal: { image: "Paysage (bannière)", ratio: "1280:720" },
};

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

export type VideoInput = { businessType: string; subject: string; format: VideoFormat };

export type VideoJobState = {
  jobId: string;
  status: "pending" | "succeeded" | "failed";
  url: string | null;
  demo: boolean;
  error: string | null;
  remaining: number;
};

function periodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function runwayHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Runway-Version": RUNWAY_VERSION,
    "Content-Type": "application/json",
  };
}

function runwayError(status: number): Error {
  if (status === 401) return new Error("La clé Runway est invalide. Vérifie la configuration.");
  if (status === 429) return new Error("Le service vidéo est saturé. Réessaie dans un instant.");
  if (status === 400) return new Error("La demande vidéo a été refusée. Reformule ta description.");
  return new Error(`La génération vidéo a échoué (${status}). Réessaie plus tard.`);
}

async function currentPlan(admin: SupabaseAdmin, userId: string) {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", userId).maybeSingle();
  return sub && sub.status === "active" && sub.plan ? sub.plan : (profile?.plan ?? "free");
}

async function readUsage(admin: SupabaseAdmin, userId: string) {
  const { data } = await admin
    .from("video_usage")
    .select("videos_used")
    .eq("user_id", userId)
    .eq("period_start", periodStart())
    .maybeSingle();
  return data?.videos_used ?? 0;
}

async function writeUsage(admin: SupabaseAdmin, userId: string, used: number) {
  await admin
    .from("video_usage")
    .upsert(
      { user_id: userId, period_start: periodStart(), videos_used: Math.max(used, 0), updated_at: new Date().toISOString() },
      { onConflict: "user_id,period_start" },
    );
}

/** Quota vidéo côté serveur. */
export async function getVideoQuota(admin: SupabaseAdmin, userId: string) {
  const plan = await currentPlan(admin, userId);
  const limit = videoLimitFor(plan);
  const used = await readUsage(admin, userId);
  return { plan, limit, used, remaining: Math.max(limit - used, 0) };
}

/** Lance une génération : vérifie le quota, le réserve, crée la tâche Runway. */
export async function startVideo(
  admin: SupabaseAdmin,
  userId: string,
  input: VideoInput,
): Promise<VideoJobState> {
  const quota = await getVideoQuota(admin, userId);
  if (quota.used >= quota.limit) {
    throw new Error(
      quota.limit === 0
        ? "La création de vidéos est incluse à partir de l'offre Starter."
        : LIMIT_REACHED_MESSAGE,
    );
  }

  const prompt = `Vidéo marketing courte et professionnelle pour un(e) ${input.businessType}. ${input.subject}. Mouvement de caméra fluide, rendu cinématographique, aucun texte à l'écran.`;
  // Pas de colonne format : on marque le prompt stocké pour l'historique.
  const storedPrompt = input.format === "vertical" ? `${prompt} [vertical]` : prompt;
  const runwayKey = process.env["RUNWAY_API_KEY"];

  if (!runwayKey) {
    const { data: job } = await admin
      .from("video_jobs")
      .insert({ user_id: userId, prompt: storedPrompt, status: "succeeded", demo: true })
      .select("id")
      .single();
    return { jobId: job!.id, status: "succeeded", url: null, demo: true, error: null, remaining: quota.remaining };
  }

  // Réserve la vidéo tout de suite pour éviter tout dépassement en parallèle.
  await writeUsage(admin, userId, quota.used + 1);

  try {
    // gen4_turbo part d'une image : on génère d'abord une image clé du sujet.
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!lovableKey) throw new Error("La génération de l'image de départ est indisponible.");
    const settings = FORMAT_SETTINGS[input.format] ?? FORMAT_SETTINGS.horizontal;
    const b64 = await requestImage(
      buildPrompt({ businessType: input.businessType, subject: input.subject, style: "Photo réaliste", format: settings.image }),
      lovableKey,
      settings.image,
    );

    const res = await fetch(`${RUNWAY_API}/image_to_video`, {
      method: "POST",
      headers: runwayHeaders(runwayKey),
      body: JSON.stringify({
        model: RUNWAY_MODEL,
        promptImage: `data:image/png;base64,${b64}`,
        promptText: prompt.slice(0, 1000),
        ratio: settings.ratio,
        duration: VIDEO_DURATION,
      }),
    });
    if (!res.ok) {
      console.error("[runway] create", res.status, await res.text().catch(() => ""));
      throw runwayError(res.status);
    }
    const { id: taskId } = (await res.json()) as { id: string };

    const { data: job, error } = await admin
      .from("video_jobs")
      .insert({ user_id: userId, prompt: storedPrompt, task_id: taskId, status: "pending" })
      .select("id")
      .single();
    if (error || !job) throw new Error("La vidéo n'a pas pu être enregistrée.");

    return { jobId: job.id, status: "pending", url: null, demo: false, error: null, remaining: quota.remaining - 1 };
  } catch (err) {
    await writeUsage(admin, userId, quota.used); // rembourse
    throw err;
  }
}

/** Interroge Runway ; à la fin, stocke la vidéo et renvoie une URL signée. */
export async function checkVideo(
  admin: SupabaseAdmin,
  userId: string,
  jobId: string,
): Promise<VideoJobState> {
  const { data: job } = await admin
    .from("video_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!job) throw new Error("Vidéo introuvable.");
  const quota = await getVideoQuota(admin, userId);
  const base = { jobId, demo: job.demo, remaining: quota.remaining };

  const sign = async (path: string) => {
    const { data } = await admin.storage.from("videos").createSignedUrl(path, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? null;
  };

  if (job.status === "succeeded") {
    return { ...base, status: "succeeded", url: job.path ? await sign(job.path) : null, error: null };
  }
  if (job.status === "failed") {
    return { ...base, status: "failed", url: null, error: job.error };
  }

  const runwayKey = process.env["RUNWAY_API_KEY"];
  if (!runwayKey || !job.task_id) throw new Error("Le service vidéo n'est pas configuré.");

  const res = await fetch(`${RUNWAY_API}/tasks/${job.task_id}`, { headers: runwayHeaders(runwayKey) });
  if (!res.ok) {
    if (res.status === 429) return { ...base, status: "pending", url: null, error: null };
    throw runwayError(res.status);
  }
  const task = (await res.json()) as { status: string; output?: string[]; failure?: string };

  if (task.status === "FAILED" || task.status === "CANCELLED") {
    const message = "La génération vidéo a échoué. Ta vidéo n'a pas été décomptée, réessaie.";
    console.error("[runway] task failed", task.failure);
    await admin.from("video_jobs").update({ status: "failed", error: message }).eq("id", jobId);
    await writeUsage(admin, userId, quota.used - 1);
    return { ...base, remaining: quota.remaining + 1, status: "failed", url: null, error: message };
  }

  if (task.status !== "SUCCEEDED" || !task.output?.[0]) {
    return { ...base, status: "pending", url: null, error: null };
  }

  const file = await fetch(task.output[0]);
  if (!file.ok) throw new Error("La vidéo a été créée mais n'a pas pu être récupérée.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.mp4`;
  const { error: upErr } = await admin.storage
    .from("videos")
    .upload(path, bytes, { contentType: "video/mp4", upsert: false });
  if (upErr) throw new Error("La vidéo n'a pas pu être enregistrée. Réessaie.");

  await admin.from("video_jobs").update({ status: "succeeded", path }).eq("id", jobId);
  await admin.from("generations").insert({
    user_id: userId,
    tool: "video",
    input: { prompt: job.prompt } as never,
    output: { path } as never,
    demo: false,
  });
  return { ...base, status: "succeeded", url: await sign(path), error: null };
}

export type VideoHistoryItem = {
  id: string;
  status: "pending" | "succeeded" | "failed";
  url: string | null;
  demo: boolean;
  createdAt: string;
  vertical: boolean;
};

/** Liste les 12 dernières vidéos ; relance la vérification des vidéos encore en cours. */
export async function listVideos(admin: SupabaseAdmin, userId: string): Promise<VideoHistoryItem[]> {
  const { data: jobs } = await admin
    .from("video_jobs")
    .select("id, status, path, demo, created_at, prompt")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);
  return Promise.all(
    (jobs ?? []).map(async (job) => {
      const vertical = job.prompt.includes("[vertical]");
      let status = job.status as VideoHistoryItem["status"];
      let url: string | null = null;
      if (status === "pending") {
        try {
          const next = await checkVideo(admin, userId, job.id);
          status = next.status;
          url = next.url;
        } catch {
          // on garde "pending", nouvelle tentative au prochain chargement
        }
      } else if (status === "succeeded" && job.path) {
        const { data } = await admin.storage.from("videos").createSignedUrl(job.path, 60 * 60 * 24);
        url = data?.signedUrl ?? null;
      }
      return { id: job.id, status, url, demo: job.demo, createdAt: job.created_at, vertical };
    }),
  );
}
