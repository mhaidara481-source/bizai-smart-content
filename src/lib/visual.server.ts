// Génération d'images (visuels marketing) — logique serveur isolée.
// Un seul point d'entrée pour pouvoir changer de fournisseur d'images facilement.
import type { VisualResult } from "./ai-types";

const GATEWAY_IMAGE_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const GATEWAY_MODEL = "google/gemini-3-pro-image";

export type VisualInput = {
  businessType: string;
  subject: string;
  style: string;
  format: string;
};

const FORMAT_HINTS: Record<string, string> = {
  "Carré (post)": "cadrage carré 1:1, adapté à un post Instagram",
  "Portrait (story)": "cadrage vertical 9:16, adapté à une story ou un Reel",
  "Paysage (bannière)": "cadrage horizontal 16:9, adapté à une bannière",
};

function buildPrompt(input: VisualInput): string {
  return `Photographie marketing professionnelle pour un(e) ${input.businessType}.
Sujet : ${input.subject}.
Style visuel : ${input.style}.
Cadrage : ${FORMAT_HINTS[input.format] ?? input.format}.
Lumière naturelle et soignée, couleurs harmonieuses, qualité publicitaire, très peu ou aucun texte dans l'image, aucun logo, aucune marque, aucun visage de personne célèbre.`;
}

/** Visuel de démonstration si aucune clé fournisseur n'est configurée. */
function demoVisual(input: VisualInput): VisualResult {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#22d3ee"/></linearGradient></defs><rect width="800" height="800" fill="url(#g)"/><text x="50%" y="46%" text-anchor="middle" font-family="sans-serif" font-size="46" fill="#ffffff" font-weight="700">Mode démo</text><text x="50%" y="56%" text-anchor="middle" font-family="sans-serif" font-size="26" fill="#ffffff">${input.businessType}</text></svg>`;
  const base64 = Buffer.from(svg, "utf8").toString("base64");
  return { url: `data:image/svg+xml;base64,${base64}`, prompt: buildPrompt(input) };
}

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

const FORMAT_ASPECT_RATIOS: Record<string, string> = {
  "Carré (post)": "1:1",
  "Portrait (story)": "9:16",
  "Paysage (bannière)": "16:9",
};

async function requestImage(
  prompt: string,
  apiKey: string,
  format: string,
): Promise<string> {
  const response = await fetch(GATEWAY_IMAGE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      generationConfig: {
        imageConfig: {
          imageSize: "2K",
          aspectRatio: FORMAT_ASPECT_RATIOS[format] ?? "1:1",
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new Error("Le service d'images est momentanément saturé. Réessaie dans un instant.");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error(
        "La génération d'images est indisponible : crédits IA épuisés ou accès bloqué.",
      );
    }
    throw new Error(`La génération d'image a échoué (${response.status}). ${text.slice(0, 200)}`);
  }

  const json = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("Le fournisseur n'a renvoyé aucune image.");
  return b64;
}

/** Génère un visuel, le stocke et renvoie une URL signée. */
export async function generateVisual(
  admin: SupabaseAdmin,
  userId: string,
  input: VisualInput,
): Promise<{ data: VisualResult; demo: boolean }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { data: demoVisual(input), demo: true };
  }

  const prompt = buildPrompt(input);
  const b64 = await requestImage(prompt, apiKey, input.format);
  const bytes = Buffer.from(b64, "base64");
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.png`;

  const { error: uploadError } = await admin.storage
    .from("visuals")
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (uploadError) {
    throw new Error("Le visuel n'a pas pu être enregistré. Réessaie.");
  }

  const { data: signed, error: signError } = await admin.storage
    .from("visuals")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signError || !signed?.signedUrl) {
    throw new Error("Le visuel a été créé mais son lien n'a pas pu être généré.");
  }

  return { data: { url: signed.signedUrl, prompt, path }, demo: false };
}
