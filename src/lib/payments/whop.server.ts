// Couche fournisseur de paiement — isolée pour pouvoir brancher Whop (ou un
// autre fournisseur) sans toucher au reste de l'application.
//
// Secrets attendus (à configurer dans Project Settings → Secrets quand les
// vraies clés Whop seront disponibles) :
//   - WHOP_API_KEY
//   - WHOP_PRODUCT_ID_STARTER
//   - WHOP_PRODUCT_ID_PRO
//   - WHOP_PRODUCT_ID_BUSINESS
//   - WHOP_WEBHOOK_SECRET
//
// Aucune valeur factice n'est écrite dans le code : tant que WHOP_API_KEY est
// absente, l'application reste en mode démo.
import type { PlanId } from "@/lib/plans";

export type PaymentMode = "live" | "demo";

export function whopConfig() {
  const apiKey = process.env["WHOP_API_KEY"] ?? null;
  const webhookSecret = process.env["WHOP_WEBHOOK_SECRET"] ?? null;
  const productIds: Record<Exclude<PlanId, "free">, string | null> = {
    starter: process.env["WHOP_PRODUCT_ID_STARTER"] ?? null,
    pro: process.env["WHOP_PRODUCT_ID_PRO"] ?? null,
    business: process.env["WHOP_PRODUCT_ID_BUSINESS"] ?? null,
  };

  return {
    apiKey,
    productIds,
    webhookSecret,
    // Le mode démo ne dépend que de l'absence de clé API : un Product ID
    // manquant pour un plan précis bloque ce plan, pas les autres.
    mode: (apiKey ? "live" : "demo") as PaymentMode,
  };
}

export type CheckoutSession = {
  mode: PaymentMode;
  /** URL de paiement Whop (null en mode démo). */
  url: string | null;
  plan: PlanId;
};

function productIdForPlan(plan: PlanId): string | null {
  if (plan === "free") return null;
  return whopConfig().productIds[plan];
}

type WhopPlan = { id: string; product?: string; access_pass?: string; visibility?: string };

// Cache mémoire : évite un appel API à chaque checkout.
const planIdCache = new Map<string, string>();

/**
 * Récupère automatiquement le plan_id (formule de prix) associé à un product_id
 * via l'API Whop. Whop exige plan_id (ou price) pour créer une session.
 */
export async function resolvePlanId(productId: string, apiKey: string): Promise<string> {
  const cached = planIdCache.get(productId);
  if (cached) return cached;

  const response = await fetch("https://api.whop.com/api/v2/plans?per=50", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "erreur inconnue");
    throw new Error(`Impossible de récupérer les formules Whop (${response.status}) : ${text}`);
  }

  const payload = (await response.json()) as { data?: WhopPlan[] };
  const plans = payload.data ?? [];
  const match =
    plans.find((p) => (p.product === productId || p.access_pass === productId) && p.visibility !== "archived") ??
    plans.find((p) => p.product === productId || p.access_pass === productId);

  if (!match?.id) {
    throw new Error(`Aucune formule de prix Whop trouvée pour le produit ${productId}.`);
  }

  planIdCache.set(productId, match.id);
  return match.id;
}

/**
 * Crée une session de paiement Whop pour le plan demandé.
 *
 * Chaque plan payant possède son propre Product ID. Le Product ID est choisi
 * côté serveur en fonction du plan, l'utilisateur ne peut pas le modifier.
 */
export async function createCheckoutSession(input: {
  userId: string;
  plan: PlanId;
}): Promise<CheckoutSession> {
  const config = whopConfig();

  if (config.mode === "demo") {
    return { mode: "demo", url: null, plan: input.plan };
  }

  const productId = productIdForPlan(input.plan);
  if (!productId) {
    throw new Error(`Aucun Product ID Whop configuré pour le plan ${input.plan}.`);
  }

  const planId = await resolvePlanId(productId, config.apiKey!);

  const response = await fetch("https://api.whop.com/api/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      metadata: { supabase_user_id: input.userId, plan: input.plan },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "erreur inconnue");
    throw new Error(`Whop a retourné une erreur (${response.status}) : ${text}`);
  }

  const data = (await response.json()) as { purchase_url?: string; url?: string; checkout_url?: string };
  const url = data.purchase_url ?? data.url ?? data.checkout_url ?? null;
  if (!url) {
    throw new Error("Whop n'a pas renvoyé d'URL de paiement.");
  }

  return { mode: "live", url, plan: input.plan };
}

/**
 * Portail client Whop : l'utilisateur y gère/annule ses abonnements
 * (connecté avec le même email que lors du paiement).
 */
export const WHOP_CUSTOMER_PORTAL_URL = "https://whop.com/@me/settings/memberships/";

/**
 * Vérifie la signature d'un webhook Whop. Supporte :
 *  - le format "Standard Webhooks" (headers webhook-id / webhook-timestamp / webhook-signature)
 *  - l'ancien format HMAC hex (x-whop-signature).
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  std?: { id: string | null; timestamp: string | null; signature: string | null },
) {
  const secret = whopConfig().webhookSecret;
  if (!secret) return { ok: false, configured: false as const };

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const safeEq = (x: string, y: string) => {
    const a = Buffer.from(x);
    const b = Buffer.from(y);
    return a.length === b.length && timingSafeEqual(a, b);
  };

  if (std?.id && std.timestamp && std.signature) {
    const keyRaw = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const candidates = [Buffer.from(keyRaw, "base64"), Buffer.from(secret, "utf8")];
    const signed = `${std.id}.${std.timestamp}.${rawBody}`;
    const provided = std.signature.split(" ").map((s) => s.replace(/^v1,/, ""));
    const ok = candidates.some((key) => {
      const expected = createHmac("sha256", key).update(signed).digest("base64");
      return provided.some((p) => safeEq(p, expected));
    });
    return { ok, configured: true as const };
  }

  if (!signatureHeader) return { ok: false, configured: true as const };
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");
  return { ok: safeEq(provided, expected), configured: true as const };
}
