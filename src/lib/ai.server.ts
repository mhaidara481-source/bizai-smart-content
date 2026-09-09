// Logique IA centralisée + contrôle serveur des quotas.
// Un seul point d'entrée (generateContent) pour pouvoir changer de fournisseur IA
// sans toucher aux appelants.
import {
  LIMIT_REACHED_MESSAGE,
  type CalendarResult,
  type IdeasResult,
  type PostResult,
  type ReviewResult,
} from "./ai-types";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

export const PLAN_LIMITS: Record<string, number> = { free: 5, starter: 100, pro: 500 };

export type ToolName = "post" | "review" | "ideas" | "calendar";

export type GenerateInput = {
  tool: ToolName;
  businessType?: string;
  platform?: string;
  topic?: string;
  tone?: string;
  language?: string;
  review?: string;
  count?: number;
  startDate?: string;
};

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

function periodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

/** Vérifie le quota mensuel côté serveur. Lève une erreur claire si dépassé. */
export async function assertQuota(admin: SupabaseAdmin, userId: string) {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const plan =
    sub && sub.status === "active" && sub.plan ? sub.plan : (profile?.plan ?? "free");
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS["free"]!;

  const period = periodStart();
  const { data: usage } = await admin
    .from("usage")
    .select("generations_used")
    .eq("user_id", userId)
    .eq("period_start", period)
    .maybeSingle();

  const used = usage?.generations_used ?? 0;
  if (used >= limit) {
    throw new Error(LIMIT_REACHED_MESSAGE);
  }
  return { plan, limit, used, period };
}

/** Incrémente le compteur et enregistre la génération. */
export async function recordGeneration(
  admin: SupabaseAdmin,
  userId: string,
  quota: { limit: number; used: number; period: string },
  tool: ToolName,
  input: unknown,
  output: unknown,
  demo: boolean,
) {
  const nextUsed = quota.used + 1;
  await admin
    .from("usage")
    .upsert(
      { user_id: userId, period_start: quota.period, generations_used: nextUsed },
      { onConflict: "user_id,period_start" },
    );
  await admin.from("generations").insert({
    user_id: userId,
    tool,
    input: input as never,
    output: output as never,
    demo,
  });
  await admin.from("profiles").update({ generations_used: nextUsed }).eq("id", userId);
  return Math.max(quota.limit - nextUsed, 0);
}

function buildPrompt(input: GenerateInput): { system: string; user: string } {
  const lang = input.language === "Anglais" ? "anglais" : "français";
  const base = `Tu es un expert en marketing digital pour petites entreprises locales. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans balises de code. Le contenu rédigé doit être en ${lang}.`;

  switch (input.tool) {
    case "post":
      return {
        system: base,
        user: `Rédige une publication ${input.platform} pour un(e) ${input.businessType}.
Sujet : ${input.topic}
Ton : ${input.tone}
Format JSON attendu : {"hook": string, "body": string, "cta": string, "hashtags": string[]}
Le hook est une accroche courte, body le texte du post adapté à ${input.platform}, cta un appel à l'action, hashtags 6 à 10 hashtags pertinents (avec le #).`,
      };
    case "review":
      return {
        system: `${base} Tu réponds toujours de manière naturelle, professionnelle et courtoise, jamais agressive, ironique ou insultante, même si l'avis est hostile.`,
        user: `Entreprise : ${input.businessType}
Avis client : """${input.review}"""
Ton souhaité : ${input.tone}
Détecte le sentiment de l'avis et adapte la réponse.
Format JSON attendu : {"sentiment": "positif" | "neutre" | "négatif", "reply": string}`,
      };
    case "ideas":
      return {
        system: base,
        user: `Propose ${input.count} idées de contenu ${input.platform} pour un(e) ${input.businessType}.
Format JSON attendu : {"ideas": [{"subject": string, "hook": string, "format": string, "description": string, "cta": string}]}
Exactement ${input.count} idées, variées et concrètes. "format" par exemple : Reel, Carrousel, Photo, Story, Vidéo courte.`,
      };
    case "calendar":
      return {
        system: base,
        user: `Crée un calendrier marketing de 30 jours pour un(e) ${input.businessType}, à partir du ${input.startDate} (une entrée par jour, dates au format YYYY-MM-DD, consécutives).
Format JSON attendu : {"entries": [{"entry_date": string, "platform": string, "idea": string, "format": string}]}
Plateformes possibles : Instagram, Facebook, TikTok, LinkedIn. Exactement 30 entrées.`,
      };
  }
}

function demoResult(input: GenerateInput): unknown {
  const b = input.businessType ?? "entreprise";
  switch (input.tool) {
    case "post":
      return {
        hook: `[Mode démo] ${input.topic ?? "Nouveauté"} : ce que tout le monde attendait chez nous 👀`,
        body: `Chez nous, ${String(input.topic ?? "la nouveauté").toLowerCase()} c'est bien plus qu'une annonce. Notre équipe de ${b.toLowerCase()} prépare tout avec soin pour que chaque client reparte avec le sourire. Passe nous voir cette semaine et découvre-le par toi-même.`,
        cta: "Réserve ta place dès maintenant, les places partent vite !",
        hashtags: ["#local", "#commercelocal", "#nouveaute", "#bonplan", "#qualite", "#equipe"],
      } satisfies PostResult;
    case "review": {
      const text = (input.review ?? "").toLowerCase();
      const negative = /(mauvais|nul|déçu|decu|jamais|horrible|sale|attente|cher)/.test(text);
      const sentiment: ReviewResult["sentiment"] = negative ? "négatif" : "positif";
      return {
        sentiment,
        reply: negative
          ? "[Mode démo] Bonjour et merci d'avoir pris le temps de nous écrire. Nous sommes sincèrement désolés que votre expérience n'ait pas été à la hauteur de vos attentes. Votre retour est précieux : nous en discutons avec l'équipe pour corriger ce point. N'hésitez pas à nous contacter en message privé, nous aimerions nous rattraper lors de votre prochaine visite."
          : "[Mode démo] Bonjour et merci beaucoup pour ce retour, il fait vraiment plaisir à toute l'équipe ! Nous sommes ravis que votre visite se soit aussi bien passée. Au plaisir de vous accueillir très bientôt !",
      } satisfies ReviewResult;
    }
    case "ideas": {
      const formats = ["Reel", "Carrousel", "Photo", "Story", "Vidéo courte"];
      const ideas = Array.from({ length: input.count ?? 10 }, (_, i) => ({
        subject: `[Mode démo] Idée ${i + 1} : coulisses de notre ${b.toLowerCase()}`,
        hook: "Ce que nos clients ne voient jamais…",
        format: formats[i % formats.length]!,
        description:
          "Montre une étape de ton quotidien, explique pourquoi elle compte et termine en invitant les clients à venir.",
        cta: "Viens découvrir ça sur place cette semaine !",
      }));
      return { ideas } satisfies IdeasResult;
    }
    case "calendar": {
      const platforms = ["Instagram", "Facebook", "TikTok", "LinkedIn"];
      const formats = ["Reel", "Carrousel", "Photo", "Story"];
      const start = input.startDate ? new Date(input.startDate) : new Date();
      const entries = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return {
          entry_date: d.toISOString().slice(0, 10),
          platform: platforms[i % platforms.length]!,
          idea: `[Mode démo] Jour ${i + 1} : mets en avant un service ou un produit phare de ton ${b.toLowerCase()}`,
          format: formats[i % formats.length]!,
        };
      });
      return { entries } satisfies CalendarResult;
    }
  }
}

function parseJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("La réponse de l'IA n'a pas pu être lue. Réessaie.");
  }
}

/**
 * Point d'entrée unique des appels IA.
 * Sans clé API configurée : mode démo avec des exemples réalistes.
 */
export async function generateContent(
  input: GenerateInput,
): Promise<{ data: unknown; demo: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { data: demoResult(input), demo: true };

  const { system, user } = buildPrompt(input);
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new Error("L'IA est très demandée en ce moment. Réessaie dans quelques secondes.");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error(
        "Le service IA est momentanément indisponible (crédits ou accès). Réessaie plus tard.",
      );
    }
    console.error("[AI] gateway error", response.status, body);
    throw new Error("La génération a échoué. Réessaie dans un instant.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("L'IA n'a renvoyé aucun contenu. Réessaie.");
  return { data: parseJson(content), demo: false };
}
