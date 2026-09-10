import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { toolItems } from "@/lib/nav";
import { useProfile, PLAN_LABELS, PLAN_LIMITS } from "@/hooks/useProfile";
import {
  TOOL_LABELS,
  useRecentGenerations,
  useSubscription,
  useUsage,
} from "@/hooks/useUsage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BizAI" },
      { name: "description", content: "Ton activité et tes outils BizAI en un coup d'œil." },
      { property: "og:title", content: "Dashboard — BizAI" },
      { property: "og:description", content: "Suis tes générations et accède à tes outils." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const { data: usedThisMonth = 0 } = useUsage();
  const { data: recent = [] } = useRecentGenerations();
  const plan =
    subscription?.status === "active" ? subscription.plan : (profile?.plan ?? "free");
  const used = usedThisMonth;
  const limit = PLAN_LIMITS[plan] ?? 5;
  const remaining = Math.max(limit - used, 0);
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Bonjour ${profile?.full_name?.split(" ")[0] ?? ""}`.trim()}
        subtitle="Voici où tu en es ce mois-ci."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Générations utilisées</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{used}</p>
            <Progress value={percent} className="mt-4" />
            <p className="mt-2 text-xs text-muted-foreground">sur {limit} ce mois-ci</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Générations restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{remaining}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Réinitialisées au début de chaque mois
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{PLAN_LABELS[plan] ?? "Découverte"}</p>
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <Link to="/abonnement">Gérer mon offre</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Tes outils</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {toolItems.map((tool) => (
          <Card key={tool.to} className="rounded-2xl border-border/70 shadow-soft">
            <CardContent className="flex items-start gap-4 pt-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <tool.icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">{tool.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2 rounded-full">
                  <Link to={tool.to}>
                    Ouvrir
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Activité récente</h2>
      <Card className="rounded-2xl border-border/70 shadow-soft">
        <CardContent className="flex flex-col items-center py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
            <Sparkles className="size-5 text-primary" />
          </span>
          <p className="mt-4 font-semibold">Aucune activité pour l'instant</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tes contenus générés apparaîtront ici dès que tu commenceras à utiliser les outils.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
