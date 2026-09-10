import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Check, Settings2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_LABELS, useProfile } from "@/hooks/useProfile";
import { planLimit, useSubscription, useUsage } from "@/hooks/useUsage";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement — BizAI" },
      { name: "description", content: "Gère ton offre BizAI et suis tes générations mensuelles." },
      { property: "og:title", content: "Abonnement — BizAI" },
      { property: "og:description", content: "Starter 19€/mois ou Pro 39€/mois." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionPage,
});

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "19€",
    quota: "100 générations par mois",
    features: ["100 générations par mois", "Les 4 outils IA", "Calendrier 30 jours", "Support email"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "39€",
    quota: "500 générations par mois",
    features: [
      "500 générations par mois",
      "Les 4 outils IA",
      "Calendrier 30 jours",
      "Support prioritaire",
    ],
  },
] as const;

const PAYMENT_SOON = "L'intégration des paiements arrive bientôt.";

function notifyPaymentSoon() {
  toast.info(PAYMENT_SOON, {
    description: "Tu pourras régler ton abonnement en ligne dès que ce sera ouvert.",
  });
}

function SubscriptionPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: used = 0, isLoading: usageLoading } = useUsage();

  const loading = profileLoading || subLoading || usageLoading;

  const activePlan =
    subscription?.status === "active" ? subscription.plan : (profile?.plan ?? "free");
  const hasPaidPlan = activePlan === "starter" || activePlan === "pro";
  const limit = planLimit(activePlan);
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const upgradeLabel =
    activePlan === "pro" ? "Tu es déjà sur Pro" : hasPaidPlan ? "Passer à Pro" : "Choisir Starter";

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
                    {hasPaidPlan ? (PLAN_LABELS[activePlan] ?? "Découverte") : "Aucun abonnement"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {used} / {limit} générations utilisées ce mois-ci
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
                  disabled={activePlan === "pro"}
                  onClick={notifyPaymentSoon}
                >
                  {upgradeLabel}
                  {activePlan !== "pro" && <ArrowUpRight className="size-4" />}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={notifyPaymentSoon}>
                  <Settings2 className="size-4" />
                  Gérer mon abonnement
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const current = activePlan === plan.id;
          return (
            <Card key={plan.id} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {current && (
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      Ton offre
                    </span>
                  )}
                </div>
                <p className="mt-3 text-3xl font-extrabold">
                  {plan.price}
                  <span className="text-base font-medium text-muted-foreground">/mois</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{plan.quota}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="size-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full rounded-full"
                  variant={current ? "outline" : "default"}
                  disabled={current || loading}
                  onClick={notifyPaymentSoon}
                >
                  {current ? "Offre active" : `Choisir ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 rounded-2xl border-border/70 bg-primary-soft/50 shadow-soft">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-background">
            <Sparkles className="size-5 text-primary" />
          </span>
          <div>
            <p className="font-semibold">{PAYMENT_SOON}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le règlement en ligne n'est pas encore ouvert. Ton compte reste utilisable avec ton
              quota actuel en attendant, et tes limites sont toujours vérifiées côté serveur.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
