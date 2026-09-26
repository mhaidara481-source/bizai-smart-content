import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarDays, Check, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateCalendar } from "@/lib/ai.functions";
import { BUSINESS_TYPES, LANGUAGES } from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/calendrier")({
  head: () => ({
    meta: [
      { title: "Calendrier marketing — BizAI" },
      {
        name: "description",
        content: "Génère et suis ton calendrier marketing de 30 jours, jour par jour.",
      },
      { property: "og:title", content: "Calendrier marketing — BizAI" },
      { property: "og:description", content: "Planifie ton mois de communication en un clic." },
    ],
  }),
  component: CalendarPage,
});

type Entry = {
  id: string;
  entry_date: string;
  platform: string;
  idea: string;
  format: string;
  status: string;
};

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function CalendarPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const run = useServerFn(generateCalendar);

  const [businessType, setBusinessType] = useState(profile?.business_type ?? "Restaurant");
  const [language, setLanguage] = useState("Français");
  const [demo, setDemo] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const entriesQuery = useQuery({
    queryKey: ["calendar", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase
        .from("content_calendar")
        .select("id, entry_date, platform, idea, format, status")
        .eq("user_id", user!.id)
        .order("entry_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Entry[];
    },
  });

  const generate = useMutation({
    mutationFn: async () => run({ data: { businessType, language } }),
    onSuccess: (res) => {
      setDemo(res.demo);
      setLimitReached(false);
      void queryClient.invalidateQueries();
      toast.success("Calendrier de 30 jours généré !");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle")) {
        setLimitReached(true);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (entry: Entry) => {
      const next = entry.status === "publie" ? "a_publier" : "publie";
      const { error } = await supabase
        .from("content_calendar")
        .update({ status: next })
        .eq("id", entry.id);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      void queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success(next === "publie" ? "Marqué comme publié" : "Remis à publier");
    },
    onError: () => toast.error("La mise à jour a échoué."),
  });

  const entries = entriesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Calendrier marketing"
        subtitle="30 jours de contenu planifiés, à cocher au fur et à mesure."
      />

      {limitReached && (
        <div className="mb-6">
          <LimitReached />
        </div>
      )}

      <Card className="mb-8 rounded-2xl border-border/70 shadow-soft">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2">
            <Label>Type d'activité</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Langue</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-full"
            disabled={generate.isPending}
            onClick={() => generate.mutate()}
          >
            {generate.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Génération…
              </>
            ) : (
              <>
                <CalendarDays className="size-4" /> Générer 30 jours
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {demo && (
        <div className="mb-5">
          <DemoBadge />
        </div>
      )}

      {(entriesQuery.isLoading || generate.isPending) && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full space-y-2">
                  <div className="flex gap-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16 rounded-full" /></div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-9 w-32 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!entriesQuery.isLoading && !generate.isPending && entries.length === 0 && (
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
              <CalendarDays className="size-5 text-primary" />
            </span>
            <p className="mt-4 font-semibold">Ton calendrier est vide</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Génère un mois complet de contenu en un clic.
            </p>
          </CardContent>
        </Card>
      )}

      {!generate.isPending && entries.length > 0 && (
        <div className="space-y-3 animate-fade-in-up">
          {entries.map((entry) => {
            const published = entry.status === "publie";
            return (
              <Card key={entry.id} className="rounded-2xl border-border/70 shadow-soft">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{formatDate(entry.entry_date)}</span>
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {entry.platform}
                      </span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {entry.format}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          published
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {published ? "Publié" : "À publier"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{entry.idea}</p>
                  </div>
                  <Button
                    variant={published ? "outline" : "default"}
                    size="sm"
                    className="shrink-0 rounded-full"
                    disabled={toggleStatus.isPending}
                    onClick={() => toggleStatus.mutate(entry)}
                  >
                    {published ? (
                      <>
                        <RotateCcw className="size-4" /> À publier
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> Marquer publié
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
