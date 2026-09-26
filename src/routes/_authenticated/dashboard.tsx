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
import { Skeleton } from "@/components/ui/skeleton";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead({ title: "Tableau de bord — BizAI", description: "Ton activité et tes outils BizAI en un coup d'œil.", path: "/dashboard", noindex: true }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: usedThisMonth = 0, isLoading: usageLoading } = useUsage();
  const { data: recent = [], isLoading: recentLoading } = useRecentGenerations();
  const loading = profileLoading || subscriptionLoading || usageLoading;
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Générations utilisées</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-2 w-full" /><Skeleton className="h-3 w-28" /></div> : <div className="animate-fade-in"><p className="text-3xl font-extrabold">{used}</p><Progress value={percent} className="mt-4" /><p className="mt-2 text-xs text-muted-foreground">sur {limit} ce mois-ci</p></div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Générations restantes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-3 w-44" /></div> : <div className="animate-fade-in"><p className="text-3xl font-extrabold">{remaining}</p><p className="mt-2 text-xs text-muted-foreground">
              Réinitialisées au début de chaque mois
            </p></div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-36" /> : <p className="animate-fade-in text-3xl font-extrabold">{PLAN_LABELS[plan] ?? "Découverte"}</p>}
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <Link to="/abonnement">Gérer mon offre</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold">Tes outils</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {toolItems.map((tool) => (
          <Card key={tool.to} className="border-border/70 hover:border-primary/20 hover:shadow-lift">
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
        {recentLoading ? (
          <CardContent className="space-y-4 py-6">{[0, 1, 2].map((item) => <div key={item} className="flex items-center justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>)}</CardContent>
        ) : recent.length === 0 ? (
          <CardContent className="flex flex-col items-center py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
              <Sparkles className="size-5 text-primary" />
            </span>
            <p className="mt-4 font-semibold">Aucune activité pour l'instant</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tes contenus générés apparaîtront ici dès que tu commenceras à utiliser les outils.
            </p>
          </CardContent>
        ) : (
          <CardContent className="animate-fade-in divide-y divide-border/70 py-2">
            {recent.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {TOOL_LABELS[item.tool] ?? "Génération"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {item.demo && (
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                    Mode démo
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
