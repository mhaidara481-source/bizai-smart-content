// Point d'entrée client → serveur du checkout. Le fournisseur (Whop) reste
// isolé dans src/lib/payments/whop.server.ts.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "business"]),
  /** Mode démo : simule un abonnement actif sans paiement réel. */
  simulate: z.boolean().optional(),
});

export type CheckoutResult = {
  mode: "live" | "demo";
  url: string | null;
  upgraded: boolean;
  message: string;
};

export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { createCheckoutSession } = await import("@/lib/payments/whop.server");
    const session = await createCheckoutSession({ userId: context.userId, plan: data.plan });

    if (session.mode === "live") {
      return {
        mode: "live",
        url: session.url,
        upgraded: false,
        message: "Redirection vers le paiement…",
      };
    }

    if (!data.simulate) {
      return {
        mode: "demo",
        url: null,
        upgraded: false,
        message: "L'intégration des paiements arrive bientôt.",
      };
    }

    // Mode démo uniquement : aucun paiement réel n'a lieu.
    const { upsertSubscription } = await import("@/lib/payments/subscriptions.server");
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    await upsertSubscription({
      userId: context.userId,
      plan: data.plan,
      status: "active",
      provider: "demo",
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });

    return {
      mode: "demo",
      url: null,
      upgraded: true,
      message: "Abonnement activé en mode démo — aucun paiement réel n'a été effectué.",
    };
  });

export const cancelDemoSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { upsertSubscription } = await import("@/lib/payments/subscriptions.server");
    await upsertSubscription({
      userId: context.userId,
      plan: "starter",
      status: "cancelled",
      provider: "demo",
    });
    return { cancelled: true };
  });
