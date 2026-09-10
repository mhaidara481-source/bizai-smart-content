// Écriture serveur des abonnements. Utilisé par le webhook Whop et par le
// checkout de démonstration. Aucune écriture d'abonnement n'est possible depuis
// le client (RLS : lecture seule pour le propriétaire).
import type { PlanId } from "@/lib/plans";

export type SubscriptionUpdate = {
  userId: string;
  plan: PlanId;
  status: string;
  provider?: string;
  providerSubscriptionId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
};

export async function upsertSubscription(input: SubscriptionUpdate) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const payload = {
    user_id: input.userId,
    plan: input.plan,
    status: input.status,
    provider: input.provider ?? "whop",
    ...(input.providerSubscriptionId
      ? { provider_subscription_id: input.providerSubscriptionId }
      : {}),
    ...(input.periodStart ? { current_period_start: input.periodStart } : {}),
    ...(input.periodEnd ? { current_period_end: input.periodEnd } : {}),
  };

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("subscriptions").insert(payload);
    if (error) throw error;
  }

  // Le plan du profil sert de repli pour la vérification serveur des quotas.
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ plan: input.status === "active" ? input.plan : "free" })
    .eq("id", input.userId);
  if (profileError) throw profileError;
}
