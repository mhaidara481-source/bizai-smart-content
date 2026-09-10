import { createFileRoute } from "@tanstack/react-router";

// Webhook Whop — prêt à recevoir les événements, sans paiement réel branché.
// Configure WHOP_WEBHOOK_SECRET (et WHOP_API_KEY / WHOP_PRODUCT_ID) dans les
// secrets du projet pour activer la vérification et le traitement réels.

type WhopEvent = {
  action?: string;
  type?: string;
  data?: {
    user_id?: string;
    metadata?: { user_id?: string; supabase_user_id?: string } | null;
    plan_id?: string;
    product_id?: string;
    status?: string;
    id?: string;
    current_period_start?: string | number | null;
    current_period_end?: string | number | null;
  } | null;
};

function planFromEvent(event: WhopEvent): "starter" | "pro" {
  const raw = `${event.data?.plan_id ?? ""} ${event.data?.product_id ?? ""}`.toLowerCase();
  return raw.includes("pro") ? "pro" : "starter";
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

async function upsertSubscription(input: {
  userId: string;
  plan: "starter" | "pro" | "free";
  status: string;
  providerSubscriptionId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const payload: Record<string, unknown> = {
    user_id: input.userId,
    plan: input.plan,
    status: input.status,
    provider: "whop",
  };
  if (input.providerSubscriptionId) payload["provider_subscription_id"] = input.providerSubscriptionId;
  if (input.periodStart) payload["current_period_start"] = input.periodStart;
  if (input.periodEnd) payload["current_period_end"] = input.periodEnd;

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabaseAdmin.from("subscriptions").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("subscriptions").insert(payload as never);
    if (error) throw error;
  }

  // Le plan reste la source de vérité côté serveur pour les limites de génération.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ plan: input.status === "active" ? input.plan : "free" })
    .eq("id", input.userId);
  if (profileError) throw profileError;
}

// Handlers par type d'événement Whop.
const handlers: Record<string, (event: WhopEvent, userId: string) => Promise<void>> = {
  "payment.succeeded": async (event, userId) => {
    await upsertSubscription({
      userId,
      plan: planFromEvent(event),
      status: "active",
      providerSubscriptionId: event.data?.id ?? null,
      periodStart: toIso(event.data?.current_period_start),
      periodEnd: toIso(event.data?.current_period_end),
    });
  },
  "membership.went_valid": async (event, userId) => {
    await upsertSubscription({
      userId,
      plan: planFromEvent(event),
      status: "active",
      providerSubscriptionId: event.data?.id ?? null,
      periodStart: toIso(event.data?.current_period_start),
      periodEnd: toIso(event.data?.current_period_end),
    });
  },
  "membership.went_invalid": async (event, userId) => {
    await upsertSubscription({
      userId,
      plan: planFromEvent(event),
      status: "cancelled",
      providerSubscriptionId: event.data?.id ?? null,
    });
  },
  "membership.cancelled": async (event, userId) => {
    await upsertSubscription({
      userId,
      plan: planFromEvent(event),
      status: "cancelled",
      providerSubscriptionId: event.data?.id ?? null,
    });
  },
  "payment.failed": async (event, userId) => {
    await upsertSubscription({
      userId,
      plan: planFromEvent(event),
      status: "past_due",
      providerSubscriptionId: event.data?.id ?? null,
    });
  },
};

async function verifySignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env["WHOP_WEBHOOK_SECRET"];
  if (!secret) return { ok: false, configured: false as const };
  if (!signatureHeader) return { ok: false, configured: true as const };

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return { ok: a.length === b.length && timingSafeEqual(a, b), configured: true as const };
}

export const Route = createFileRoute("/api/public/whop-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature =
          request.headers.get("x-whop-signature") ?? request.headers.get("whop-signature");

        const check = await verifySignature(rawBody, signature);
        if (!check.configured) {
          // Aucune clé configurée : l'intégration n'est pas encore active.
          return Response.json(
            { received: false, reason: "whop_not_configured" },
            { status: 503 },
          );
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
