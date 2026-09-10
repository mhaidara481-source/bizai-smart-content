// Couche fournisseur de paiement — isolée pour pouvoir brancher Whop (ou un
// autre fournisseur) sans toucher au reste de l'application.
//
// Secrets attendus (à configurer dans Project Settings → Secrets quand les
// vraies clés Whop seront disponibles) :
//   - WHOP_API_KEY
//   - WHOP_PRODUCT_ID_STARTER
//   - WHOP_PRODUCT_ID_PRO
//   - WHOP_WEBHOOK_SECRET
//
// Aucune valeur factice n'est écrite dans le code : tant que WHOP_API_KEY est
// absente, l'application reste en mode démo.
import type { PlanId } from "@/lib/plans";

export type PaymentMode = "live" | "demo";

const PAID_PLANS: PlanId[] = ["starter", "pro", "business"];

export function whopConfig() {
  const apiKey = process.env["WHOP_API_KEY"] ?? null;
  const webhookSecret = process.env["WHOP_WEBHOOK_SECRET"] ?? null;
  const productIds: Record<Exclude<PlanId, "free">, string | null> = {
    starter: process.env["WHOP_PRODUCT_ID_STARTER"] ?? null,
    pro: process.env["WHOP_PRODUCT_ID_PRO"] ?? null,
    business: process.env["WHOP_PRODUCT_ID_PRO"] ?? null,
  };

  const hasAllProducts = PAID_PLANS.every((plan) => plan === "free" || productIds[plan as Exclude<PlanId, "free">]);
  return {
    apiKey,
    productIds,
    webhookSecret,
    mode: (apiKey && hasAllProducts ? "live" : "demo") as PaymentMode,
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

  const response = await fetch("https://api.whop.com/api/v2/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      metadata: { supabase_user_id: input.userId, plan: input.plan },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "erreur inconnue");
    throw new Error(`Whop a retourné une erreur (${response.status}) : ${text}`);
  }

  const data = (await response.json()) as { url?: string; checkout_url?: string };
  const url = data.url ?? data.checkout_url ?? null;
  if (!url) {
    throw new Error("Whop n'a pas renvoyé d'URL de paiement.");
  }

  return { mode: "live", url, plan: input.plan };
}

/**
 * URL du portail de gestion d'abonnement Whop.
 * TODO(whop): retourner l'URL réelle du portail client une fois Whop branché.
 */
export function billingPortalUrl(): string | null {
  return whopConfig().mode === "live" ? null : null;
}

/** Vérifie la signature d'un webhook Whop. */
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = whopConfig().webhookSecret;
  if (!secret) return { ok: false, configured: false as const };
  if (!signatureHeader) return { ok: false, configured: true as const };

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return { ok: a.length === b.length && timingSafeEqual(a, b), configured: true as const };
}
