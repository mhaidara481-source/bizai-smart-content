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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead({ title: "Tableau de bord — BizAI", description: "Ton activité et tes outils BizAI en un coup d'œil.", path: "/dashboard", noindex: true }),
  component: Dashboard,
});

const TOOL_COLORS = [
  { icon: "text-tool-1", bg: "bg-tool-1-soft", border: "hover:border-tool-1/20" },
  { icon: "text-tool-2", bg: "bg-tool-2-soft", border: "hover:border-tool-2/20" },
  { icon: "text-tool-3", bg: "bg-tool-3-soft", border: "hover:border-tool-3/20" },
  { icon: "text-tool-4", bg: "bg-tool-4-soft", border: "hover:border-tool-4/20" },
  { icon: "text-tool-5", bg: "bg-tool-5-soft", border: "hover:border-tool-5/20" },
  { icon: "text-tool-6", bg: "bg-tool-6-soft", border: "hover:border-tool-6/20" },
  { icon: "text-tool-7", bg: "bg-tool-7-soft", border: "hover:border-tool-7/20" },
];

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
    <div className="space-y-10 pb-10">
      <PageHeader
        title={`Bonjour ${profile?.full_name?.split(" ")[0] ?? ""}`.trim()}
        subtitle="Voici où tu en es ce mois-ci."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Générations utilisées</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-2 w-full" /><Skeleton className="h-3 w-28" /></div> : <div className="animate-fade-in"><p className="text-4xl font-black tracking-tight">{used}</p><Progress value={percent} className="mt-4 h-2" /><p className="mt-2 text-xs text-muted-foreground font-medium">sur {limit} ce mois-ci</p></div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Générations restantes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3"><Skeleton className="h-9 w-16" /><Skeleton className="h-3 w-44" /></div> : <div className="animate-fade-in"><p className="text-4xl font-black tracking-tight">{remaining}</p><p className="mt-2 text-xs text-muted-foreground font-medium">
              Réinitialisées au début de chaque mois
            </p></div>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-9 w-36" /> : <p className="animate-fade-in text-4xl font-black tracking-tight text-primary">{PLAN_LABELS[plan] ?? "Découverte"}</p>}
            <Button asChild variant="outline" size="sm" className="mt-4 rounded-full font-semibold border-primary/20 hover:bg-primary-soft hover:text-primary transition-all">
              <Link to="/abonnement">Gérer mon offre</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight">Tes outils boostés à l'IA</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {toolItems.map((tool, index) => {
            const colors = TOOL_COLORS[index % TOOL_COLORS.length];
            return (
              <Card 
                key={tool.to} 
                className={cn(
                  "group relative overflow-hidden border-border/50 transition-all duration-300 hover:shadow-lift",
                  colors.border
                )}
              >
                <CardContent className="flex flex-col items-start gap-4 p-6">
                  <span className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
                    colors.bg
                  )}>
                    <tool.icon className={cn("size-6", colors.icon)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{tool.label}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{tool.description}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm" className="mt-2 w-full rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <Link to={tool.to}>
                      Lancer l'outil
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                  {/* Invisible link for the whole card area */}
                  <Link to={tool.to} className="absolute inset-0 z-0">
                    <span className="sr-only">Ouvrir {tool.label}</span>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h2 className="mb-6 text-xl font-extrabold tracking-tight">Activité récente</h2>
        <Card className="rounded-2xl border-border/70 shadow-soft overflow-hidden">
          {recentLoading ? (
            <CardContent className="space-y-4 py-6">{[0, 1, 2].map((item) => <div key={item} className="flex items-center justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>)}</CardContent>
          ) : recent.length === 0 ? (
            <CardContent className="flex flex-col items-center py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
                <Sparkles className="size-6 text-primary" />
              </span>
              <p className="mt-4 text-lg font-bold">Prêt à créer ?</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tes contenus générés apparaîtront ici dès que tu commenceras à utiliser les outils BizAI.
              </p>
              <Button asChild className="mt-6 rounded-full" size="lg">
                <Link to="/creer-un-post">Commencer maintenant</Link>
              </Button>
            </CardContent>
          ) : (
            <CardContent className="animate-fade-in divide-y divide-border/50 py-0 px-0">
              {recent.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-default"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {TOOL_LABELS[item.tool] ?? "Génération"}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {new Date(item.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.demo && (
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/10">
                        Démo
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" asChild>
                       <Link to={toolItems.find(t => t.to.includes(item.tool))?.to ?? '/dashboard'}>
                          <ArrowRight className="size-4" />
                       </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </section>
    </div>
  );
}
