import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
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
import { generateIdeas } from "@/lib/ai.functions";
import { BUSINESS_TYPES, LANGUAGES, PLATFORMS, type ContentIdea } from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/idees-de-contenu")({
  head: () => ({
    meta: [
      { title: "Idées de contenu — BizAI" },
      {
        name: "description",
        content: "Obtiens 10, 20 ou 30 idées de contenu prêtes à publier pour ton activité.",
      },
      { property: "og:title", content: "Idées de contenu — BizAI" },
      { property: "og:description", content: "Ne manque plus jamais d'inspiration." },
    ],
  }),
  component: IdeasPage,
});

function IdeasPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const run = useServerFn(generateIdeas);

  const [businessType, setBusinessType] = useState(profile?.business_type ?? "Restaurant");
  const [platform, setPlatform] = useState("Instagram");
  const [count, setCount] = useState<"10" | "20" | "30">("10");
  const [language, setLanguage] = useState("Français");
  const [ideas, setIdeas] = useState<ContentIdea[] | null>(null);
  const [demo, setDemo] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      run({
        data: {
          businessType,
          platform,
          language,
          count: Number(count) as 10 | 20 | 30,
        },
      }),
    onSuccess: (res) => {
      setIdeas(res.data.ideas ?? []);
      setDemo(res.demo);
      setLimitReached(false);
      void queryClient.invalidateQueries();
      toast.success("Idées générées !");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle")) {
        setLimitReached(true);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  return (
    <div>
      <PageHeader
        title="Idées de contenu"
        subtitle="Une liste d'idées concrètes, adaptées à ton activité."
      />

      {limitReached && (
        <div className="mb-6">
          <LimitReached />
        </div>
      )}

      <Card className="mb-8 rounded-2xl border-border/70 shadow-soft">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="space-y-2">
            <Label>Activité</Label>
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
            <Label>Plateforme</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nombre d'idées</Label>
            <Select value={count} onValueChange={(v) => setCount(v as "10" | "20" | "30")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["10", "20", "30"].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} idées
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
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Génération…
              </>
            ) : (
              <>
                <Lightbulb className="size-4" /> Générer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {demo && ideas && (
        <div className="mb-5">
          <DemoBadge />
        </div>
      )}

      {mutation.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="space-y-4 pt-6">
                <div className="flex justify-between"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-4 w-8" /></div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!ideas && !mutation.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
              <Lightbulb className="size-5 text-primary" />
            </span>
            <p className="mt-4 font-semibold">Aucune idée générée pour l'instant</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Choisis ton activité et ta plateforme, puis lance la génération.
            </p>
          </CardContent>
        </Card>
      )}

      {ideas && !mutation.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
          {ideas.map((idea, index) => (
            <Card key={index} className="rounded-2xl border-border/70 shadow-soft">
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                    {idea.format}
                  </span>
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                </div>
                <h3 className="font-semibold leading-snug">{idea.subject}</h3>
                <p className="text-sm font-medium text-foreground/80">“{idea.hook}”</p>
                <p className="text-sm text-muted-foreground">{idea.description}</p>
                <p className="text-sm font-medium text-primary">{idea.cta}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
