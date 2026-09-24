import { createFileRoute } from "@tanstack/react-router";

import type { PlanId } from "@/lib/plans";

// Webhook Whop — prêt à recevoir les événements, sans paiement réel branché.
// TODO(whop): configurer WHOP_WEBHOOK_SECRET (+ WHOP_API_KEY, WHOP_PRODUCT_ID)
// dans les secrets du projet pour activer le traitement réel.

type WhopEvent = {
  action?: string;
  type?: string;
  data?: {
    user_id?: string;
    metadata?: { user_id?: string; supabase_user_id?: string; plan?: string } | null;
    plan_id?: string;
    product_id?: string;
    status?: string;
    id?: string;
    current_period_start?: string | number | null;
    current_period_end?: string | number | null;
  } | null;
};

function planFromEvent(event: WhopEvent): PlanId {
  const d = (event.data ?? {}) as Record<string, unknown>;
  const nestedId = (v: unknown) =>
    v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : null;
  const productId =
    (d["product_id"] as string | undefined) ?? nestedId(d["product"]) ?? (d["access_pass"] as string | undefined) ?? null;

  // 1) Correspondance exacte avec les Product IDs configurés côté serveur.
  if (productId) {
    const map: Array<[PlanId, string | undefined]> = [
      ["starter", process.env["WHOP_PRODUCT_ID_STARTER"]],
      ["pro", process.env["WHOP_PRODUCT_ID_PRO"]],
      ["business", process.env["WHOP_PRODUCT_ID_BUSINESS"]],
    ];
    const hit = map.find(([, id]) => id && id === productId);
    if (hit) return hit[0];
  }

  // 2) Métadonnées posées lors du checkout.
  const meta = event.data?.metadata?.plan;
  if (meta === "starter" || meta === "pro" || meta === "business") return meta;
  return "starter";
}

function userIdFromEvent(event: WhopEvent): string | null {
  return (
    event.data?.metadata?.supabase_user_id ??
    event.data?.metadata?.user_id ??
    event.data?.user_id ??
    null
  );
}

function toIso(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function applyStatus(event: WhopEvent, userId: string, status: string) {
  const { upsertSubscription } = await import("@/lib/payments/subscriptions.server");
  await upsertSubscription({
    userId,
    plan: planFromEvent(event),
    status,
    provider: "whop",
    providerSubscriptionId: event.data?.id ?? null,
    periodStart: toIso(event.data?.current_period_start),
    periodEnd: toIso(event.data?.current_period_end),
  });
}

// Handlers par type d'événement Whop.
const handlers: Record<string, (event: WhopEvent, userId: string) => Promise<void>> = {
  // Paiement réussi
  "payment.succeeded": (event, userId) => applyStatus(event, userId, "active"),
  // Abonnement actif
  "membership.went_valid": (event, userId) => applyStatus(event, userId, "active"),
  // Annulation / fin d'accès
  "membership.went_invalid": (event, userId) => applyStatus(event, userId, "cancelled"),
  "membership.cancelled": (event, userId) => applyStatus(event, userId, "cancelled"),
  // Échec de paiement
  "payment.failed": (event, userId) => applyStatus(event, userId, "past_due"),
};

export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature =
          request.headers.get("x-whop-signature") ?? request.headers.get("whop-signature");

        const { verifyWebhookSignature } = await import("@/lib/payments/whop.server");
        const check = await verifyWebhookSignature(rawBody, signature, {
          id: request.headers.get("webhook-id"),
          timestamp: request.headers.get("webhook-timestamp"),
          signature: request.headers.get("webhook-signature"),
        });
        if (!check.configured) {
          return Response.json({ received: false, reason: "whop_not_configured" }, { status: 503 });
        }
        if (!check.ok) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: WhopEvent;
        try {
          event = JSON.parse(rawBody) as WhopEvent;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const eventType = event.action ?? event.type ?? "";
        const userId = userIdFromEvent(event);
        const handler = handlers[eventType];

        if (!handler) {
          return Response.json({ received: true, handled: false, event: eventType });
        }
        if (!userId) {
          return Response.json({ received: true, handled: false, reason: "missing_user_id" });
        }

        try {
          await handler(event, userId);
        } catch (error) {
          console.error("[whop-webhook] handler failed", eventType, error);
          return new Response("Webhook processing error", { status: 500 });
        }

        return Response.json({ received: true, handled: true, event: eventType });
      },
    },
  },
});
