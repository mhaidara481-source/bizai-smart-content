// Couche fournisseur de paiement — isolée pour pouvoir brancher Whop (ou un
// autre fournisseur) sans toucher au reste de l'application.
//
// Secrets attendus (à configurer dans Project Settings → Secrets quand les
// vraies clés Whop seront disponibles) :
//   - WHOP_API_KEY
//   - WHOP_PRODUCT_ID
//   - WHOP_WEBHOOK_SECRET
//
// Aucune valeur factice n'est écrite dans le code : tant que WHOP_API_KEY est
// absente, l'application reste en mode démo.
import type { PlanId } from "@/lib/plans";

export type PaymentMode = "live" | "demo";

export function whopConfig() {
  const apiKey = process.env["WHOP_API_KEY"] ?? null;
  const productId = process.env["WHOP_PRODUCT_ID"] ?? null;
  const webhookSecret = process.env["WHOP_WEBHOOK_SECRET"] ?? null;
  return {
    apiKey,
    productId,
    webhookSecret,
    mode: (apiKey && productId ? "live" : "demo") as PaymentMode,
  };
}

export type CheckoutSession = {
  mode: PaymentMode;
  /** URL de paiement Whop (null en mode démo). */
  url: string | null;
  plan: PlanId;
};

/**
 * Crée une session de paiement.
 *
 * TODO(whop): quand WHOP_API_KEY / WHOP_PRODUCT_ID seront configurées, appeler
 * l'API Whop pour créer une session de checkout et retourner son URL, en
 * passant `metadata: { supabase_user_id: userId }` afin que le webhook
 * (/api/public/whop-webhook) puisse rattacher le paiement au bon utilisateur.
 */
export async function createCheckoutSession(input: {
  userId: string;
  plan: PlanId;
}): Promise<CheckoutSession> {
  const config = whopConfig();

  if (config.mode === "demo") {
    return { mode: "demo", url: null, plan: input.plan };
  }

  // TODO(whop): remplacer par le véritable appel API Whop.
  // const response = await fetch("https://api.whop.com/api/v2/checkout_sessions", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${config.apiKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     product_id: config.productId,
  //     metadata: { supabase_user_id: input.userId, plan: input.plan },
  //   }),
  // });
  throw new Error("L'intégration des paiements Whop n'est pas encore active.");
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
