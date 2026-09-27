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

const TOOL_TONES = [
  "bg-tool-violet-soft text-tool-violet",
  "bg-tool-blue-soft text-tool-blue",
  "bg-tool-rose-soft text-tool-rose",
  "bg-tool-amber-soft text-tool-amber",
  "bg-tool-teal-soft text-tool-teal",
  "bg-tool-sky-soft text-tool-sky",
  "bg-tool-coral-soft text-tool-coral",
] as const;

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

      <div className="grid grid-cols-2 gap-3 animate-fade-in-up sm:gap-4 lg:grid-cols-3">
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground sm:text-sm">Générations utilisées</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-2 w-full" /><Skeleton className="h-3 w-28" /></div> : <div className="animate-fade-in"><p className="text-3xl font-extrabold">{used}</p><Progress value={percent} className="mt-4" /><p className="mt-2 text-xs text-muted-foreground">sur {limit} ce mois-ci</p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground sm:text-sm">Générations restantes</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-3 w-44" /></div> : <div className="animate-fade-in"><p className="text-3xl font-extrabold">{remaining}</p><p className="mt-2 text-xs text-muted-foreground">
              Réinitialisées au début de chaque mois
            </p></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground sm:text-sm">Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {loading ? <Skeleton className="h-9 w-36" /> : <p className="animate-fade-in text-3xl font-extrabold">{PLAN_LABELS[plan] ?? "Découverte"}</p>}
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
              <Link to="/abonnement">Gérer mon offre</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 mt-9 flex items-end justify-between gap-4 sm:mt-10">
        <div>
          <h2 className="text-xl font-bold">Tes outils</h2>
          <p className="mt-1 text-sm text-muted-foreground">Crée et organise tes contenus en quelques gestes.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {toolItems.map((tool, index) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="h-full hover:border-primary/20 hover:shadow-lift motion-safe:group-hover:-translate-y-1 motion-safe:group-active:translate-y-0">
              <CardContent className="flex h-full min-h-40 flex-col p-4 sm:min-h-44 sm:p-5">
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${TOOL_TONES[index % TOOL_TONES.length]}`}>
                  <tool.icon className="size-6" />
                </span>
                <div className="mt-5 min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-snug sm:text-base">{tool.label}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {tool.description}
                  </p>
                </div>
                <span className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary sm:text-sm">
                  Ouvrir
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-xl font-bold">Activité récente</h2>
      <Card>
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
