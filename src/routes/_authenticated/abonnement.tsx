import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PLAN_LABELS } from "@/hooks/useProfile";
import { useProfile } from "@/hooks/useProfile";
import { planLimit, useSubscription, useUsage } from "@/hooks/useUsage";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({
    meta: [
      { title: "Abonnement — BizAI" },
      { name: "description", content: "Gère ton offre BizAI et suis tes générations mensuelles." },
      { property: "og:title", content: "Abonnement — BizAI" },
      { property: "og:description", content: "Starter 19€/mois ou Pro 39€/mois." },
    ],
  }),
  component: SubscriptionPage,
});

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "19€",
    features: ["100 générations par mois", "Les 4 outils IA", "Calendrier 30 jours", "Support email"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "39€",
    features: [
      "500 générations par mois",
      "Les 4 outils IA",
      "Calendrier 30 jours",
      "Support prioritaire",
    ],
  },
];

function SubscriptionPage() {
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const { data: used = 0 } = useUsage();

  const activePlan =
    subscription?.status === "active" ? subscription.plan : (profile?.plan ?? "free");
  const limit = planLimit(activePlan);
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div>
      <PageHeader title="Abonnement" subtitle="Ton offre actuelle et tes générations restantes." />

      <Card className="mb-8 rounded-2xl border-border/70 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Offre actuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold">{PLAN_LABELS[activePlan] ?? "Découverte"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {used} / {limit} générations utilisées ce mois-ci
              </p>
            </div>
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {Math.max(limit - used, 0)} restantes
            </span>
          </div>
          <Progress value={percent} className="mt-4" />
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
                  disabled={current}
                  onClick={() =>
                    toast.info("Le paiement n'est pas encore activé. Il arrivera très bientôt.")
                  }
                >
                  {current ? "Offre active" : "Choisir ce plan"}
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
            <p className="font-semibold">Paiement bientôt disponible</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le règlement en ligne n'est pas encore ouvert. Ton compte reste utilisable avec ton
              quota actuel en attendant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
