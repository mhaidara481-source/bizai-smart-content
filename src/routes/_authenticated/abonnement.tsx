import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Check, Loader2, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription, useUsage } from "@/hooks/useUsage";
import { startCheckout } from "@/lib/payments/checkout.functions";
import {
  PLANS,
  PLAN_COMPARISON,
  PLAN_LABELS,
  TEAM_MEMBERS,
  isPaidPlan,
  planLimitFor,
  type PlanId,
} from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement — BizAI" },
      {
        name: "description",
        content: "Compare les offres Starter, Pro et Business et suis tes générations mensuelles.",
      },
      { property: "og:title", content: "Abonnement — BizAI" },
      {
        property: "og:description",
        content: "Starter 19€, Pro 39€ ou Business 79€ par mois.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: used = 0, isLoading: usageLoading } = useUsage();
  const queryClient = useQueryClient();
  const checkout = useServerFn(startCheckout);
  const [pending, setPending] = useState<PlanId | null>(null);

  const loading = profileLoading || subLoading || usageLoading;

  const activePlan =
    subscription?.status === "active" ? subscription.plan : (profile?.plan ?? "free");
  const hasPaidPlan = isPaidPlan(activePlan);
  const limit = planLimitFor(activePlan);
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const nextPlan: PlanId | null =
    activePlan === "business" ? null : activePlan === "pro" ? "business" : hasPaidPlan ? "pro" : "starter";

  const primaryLabel =
    nextPlan === null
      ? "Tu es sur l'offre maximale"
      : hasPaidPlan
        ? `Passer à ${PLAN_LABELS[nextPlan]}`
        : "Choisir Starter";

  async function handleCheckout(plan: PlanId) {
    setPending(plan);
    try {
      // Mode démo : simule un abonnement actif, sans paiement réel.
      const result = await checkout({ data: { plan, simulate: true } });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      if (result.upgraded) {
        await queryClient.invalidateQueries();
        toast.success(`Offre ${PLAN_LABELS[plan]} activée`, { description: result.message });
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error("Le changement d'offre a échoué", {
        description: error instanceof Error ? error.message : "Réessaie dans un instant.",
      });
    } finally {
      setPending(null);
    }
  }

  function handleManage() {
    if (!hasPaidPlan) {
      toast.info("Tu n'as pas encore d'abonnement actif.", {
        description: "Choisis une offre ci-dessous pour commencer.",
      });
      return;
    }
    toast.info("Connecte-toi à Whop avec l'email utilisé lors du paiement.");
    window.open("https://whop.com/@me/settings/memberships/", "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <PageHeader title="Abonnement" subtitle="Ton offre actuelle et tes générations restantes." />

      <Card className="mb-8 rounded-2xl border-border/70 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Offre actuelle</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-extrabold">
                    {hasPaidPlan ? PLAN_LABELS[activePlan] : "Aucun abonnement"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {used} / {limit} générations utilisées ce mois-ci ·{" "}
                    {TEAM_MEMBERS[activePlan] ?? 1} utilisateur
                    {(TEAM_MEMBERS[activePlan] ?? 1) > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {Math.max(limit - used, 0)} restantes
                </span>
              </div>
              <Progress value={percent} className="mt-4" />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="rounded-full"
                  disabled={nextPlan === null || pending !== null}
                  onClick={() => nextPlan && handleCheckout(nextPlan)}
                >
                  {pending && pending === nextPlan ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {primaryLabel}
                  {nextPlan !== null && !pending ? <ArrowUpRight className="size-4" /> : null}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={handleManage}>
                  <Settings2 className="size-4" />
                  Gérer mon abonnement
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const current = activePlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? "relative rounded-3xl border-primary/40 shadow-lift"
                  : "rounded-3xl border-border/70 shadow-soft"
              }
            >
              {plan.highlight ? (
                <Badge className="absolute -top-3 left-6 rounded-full">Le plus choisi</Badge>
              ) : null}
              <CardContent className="flex flex-col pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {plan.name}
                  </p>
                  {current && (
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      Ton offre
                    </span>
                  )}
                </div>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  {plan.priceLabel}
                  <span className="ml-1 text-base font-medium text-muted-foreground">/mois</span>
                </p>
                <p className="mt-2 text-sm font-medium text-primary">
                  {plan.generations.toLocaleString("fr-FR")} générations par mois
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full rounded-full"
                  variant={current ? "outline" : "secondary"}
                  disabled={current || loading || pending !== null}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {pending === plan.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {current ? "Offre active" : "Choisir ce plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Comparer les offres</h2>
      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-3 font-medium text-muted-foreground">Inclus</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="pb-3 font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARISON.map((row) => (
                <tr key={row.label} className="border-t border-border/70">
                  <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                  {PLANS.map((plan) => (
                    <td key={plan.id} className="py-3 pr-4">
                      {row.values[plan.id] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-8 rounded-2xl border-border/70 bg-primary-soft/50 shadow-soft">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background">
            <Sparkles className="size-5 text-primary" />
          </span>
          <div>
            <p className="font-semibold">Mode démo — paiement bientôt disponible</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun paiement réel n'est encore possible : changer d'offre ici active simplement le
              plan pour tester l'application. Tes limites de génération restent toujours vérifiées
              côté serveur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
