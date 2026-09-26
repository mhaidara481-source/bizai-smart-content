import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTikTokConfigured = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getTikTokConfig } = await import("./tiktok.server");
    return { configured: getTikTokConfig().ready };
  });

export const startTikTokConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getTikTokConfig, buildTikTokAuthUrl, TIKTOK_CALLBACK_PATH } = await import(
      "./tiktok.server"
    );
    if (!getTikTokConfig().ready) return { demo: true as const, url: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const state = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    await supabaseAdmin.from("social_oauth_states").insert({ state, user_id: context.userId });
    const origin = new URL(getRequest().url).origin;
    return { demo: false as const, url: buildTikTokAuthUrl(state, `${origin}${TIKTOK_CALLBACK_PATH}`) };
  });

export type TikTokOutcome = {
  accountId: string;
  name: string;
  status: "published" | "processing" | "failed";
  error: string | null;
  expired?: boolean;
  privateOnly?: boolean;
};

export const publishVideoToTikTok = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        jobId: z.string().uuid(),
        accountIds: z.array(z.string().uuid()).min(1).max(5),
        caption: z.string().trim().max(2200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getTikTokConfig, getValidTikTokToken, publishTikTokVideo, TikTokError } = await import(
      "./tiktok.server"
    );
    if (!getTikTokConfig().ready) {
      throw new Error("Publication TikTok en mode démo : elle sera active une fois l'app TikTok validée.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job } = await supabaseAdmin
      .from("video_jobs")
      .select("path, status, demo")
      .eq("id", data.jobId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!job || job.status !== "succeeded" || !job.path || job.demo) {
      throw new Error("Cette vidéo n'est pas disponible pour la publication.");
    }
    const { data: file, error: dlErr } = await supabaseAdmin.storage.from("videos").download(job.path);
    if (dlErr || !file) throw new Error("Impossible de récupérer la vidéo. Réessaie.");
    const video = await file.arrayBuffer();

    const { data: accounts } = await supabaseAdmin
      .from("social_accounts")
      .select("id, name, status, token_expires_at")
      .eq("user_id", context.userId)
      .eq("platform", "tiktok")
      .in("id", data.accountIds);
    if (!accounts?.length) throw new Error("Aucun compte TikTok connecté. Connecte TikTok dans Mes réseaux.");

    const results: TikTokOutcome[] = [];
    for (const account of accounts) {
      const { data: pub } = await supabaseAdmin
        .from("social_publications")
        .insert({ user_id: context.userId, account_id: account.id, platform: "tiktok", message: data.caption })
        .select("id")
        .single();
      try {
        if (account.status !== "active") throw new TikTokError("Connexion expirée. Reconnecte TikTok.", true);
        const token = await getValidTikTokToken(supabaseAdmin, account);
        const res = await publishTikTokVideo(token, video, data.caption);
        if (pub)
          await supabaseAdmin
            .from("social_publications")
            .update({ status: "published", external_post_id: res.publishId, updated_at: new Date().toISOString() })
            .eq("id", pub.id);
        results.push({
          accountId: account.id,
          name: account.name,
          status: res.processing ? "processing" : "published",
          error: null,
          privateOnly: res.privacy === "SELF_ONLY",
        });
      } catch (e) {
        const expired = e instanceof TikTokError && e.expired;
        const message = e instanceof Error ? e.message : "Erreur inconnue.";
        if (expired) await supabaseAdmin.from("social_accounts").update({ status: "expired" }).eq("id", account.id);
        if (pub)
          await supabaseAdmin
            .from("social_publications")
            .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
            .eq("id", pub.id);
        results.push({ accountId: account.id, name: account.name, status: "failed", error: message, expired });
      }
    }
    return { results };
  });
