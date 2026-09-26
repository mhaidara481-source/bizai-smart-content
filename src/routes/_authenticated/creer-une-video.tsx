import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkVideoFn, getVideoQuotaFn, startVideoFn } from "@/lib/video.functions";
import { BUSINESS_TYPES } from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/creer-une-video")({
  head: () => ({
    meta: [
      { title: "Créer une vidéo — BizAI" },
      { name: "description", content: "Génère une vidéo marketing courte pour tes réseaux sociaux avec l'IA." },
      { property: "og:title", content: "Créer une vidéo — BizAI" },
      { property: "og:description", content: "Des vidéos marketing de 8 secondes générées par l'IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateVideo,
});

const LOADING_MESSAGES = [
  "Analyse de ta demande…",
  "Création de l'image de départ…",
  "Animation de ta vidéo…",
  "Finalisation du rendu (1 à 2 minutes)…",
];

type JobState = Awaited<ReturnType<typeof startVideoFn>>;

function CreateVideo() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const start = useServerFn(startVideoFn);
  const check = useServerFn(checkVideoFn);
  const fetchQuota = useServerFn(getVideoQuotaFn);

  const quota = useQuery({ queryKey: ["video-quota"], queryFn: () => fetchQuota() });

  const [businessType, setBusinessType] = useState<string>(profile?.business_type ?? "Restaurant");
  const [subject, setSubject] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const polling = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWorking = job?.status === "pending";

  const mutation = useMutation({
    mutationFn: () => start({ data: { businessType, subject: subject.trim() } }),
    onSuccess: (res) => {
      setJob(res);
      setLimitMessage(null);
      void queryClient.invalidateQueries({ queryKey: ["video-quota"] });
      if (res.demo) toast.success("Vidéo de démonstration prête.");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle") || error.message.includes("offre Starter")) {
        setLimitMessage(error.message);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  useEffect(() => {
    if (!job || job.status !== "pending") return;
    polling.current = setTimeout(async () => {
      try {
        const next = await check({ data: { jobId: job.jobId } });
        setJob(next);
        if (next.status === "succeeded") {
          toast.success("Vidéo générée !");
          void queryClient.invalidateQueries();
        } else if (next.status === "failed") {
          toast.error(next.error ?? "La génération a échoué.");
          void queryClient.invalidateQueries({ queryKey: ["video-quota"] });
        }
      } catch (e) {
        toast.error((e as Error).message);
        setJob({ ...job, status: "failed", error: (e as Error).message });
      }
    }, 5000);
    return () => {
      if (polling.current) clearTimeout(polling.current);
    };
  }, [job, check, queryClient]);

  const busy = mutation.isPending || isWorking;

  useEffect(() => {
    if (!busy) {
      setLoadingStep(0);
      return;
    }
    const t = setInterval(() => setLoadingStep((s) => Math.min(s + 1, LOADING_MESSAGES.length - 1)), 8000);
    return () => clearInterval(t);
  }, [busy]);

  const canSubmit = subject.trim().length >= 3 && !busy;

  return (
    <div>
      <PageHeader
        title="Créer une vidéo"
        subtitle="Décris ta vidéo, BizAI génère un clip marketing de 8 secondes en 720p."
      />

      {limitMessage && (
        <div className="mb-6">
          <LimitReached message={limitMessage} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/70">
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Vidéos restantes ce mois-ci</span>
              {quota.isLoading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="font-semibold">
                  {quota.data?.remaining ?? 0} / {quota.data?.limit ?? 0}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type d'entreprise</Label>
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
              <Label htmlFor="subject">Décris la vidéo souhaitée</Label>
              <Textarea
                id="subject"
                rows={4}
                maxLength={500}
                placeholder="Ex : un burger maison qui grésille sur le grill, ambiance chaleureuse du soir"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <Button className="w-full rounded-full" disabled={!canSubmit} onClick={() => mutation.mutate()}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Génération…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Générer la vidéo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Chaque vidéo compte dans ton quota vidéo mensuel. Une vidéo échouée n'est pas décomptée.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="pt-6">
            {!job && !busy && (
              <div className="flex flex-col items-center py-16 text-center animate-fade-in-up">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <Clapperboard className="size-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Ta vidéo apparaîtra ici</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  La génération prend en général 1 à 2 minutes.
                </p>
              </div>
            )}

            {busy && (
              <div className="space-y-4" aria-label="Génération de la vidéo en cours">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <p key={loadingStep} className="text-center text-sm text-muted-foreground animate-fade-in-up">
                  {LOADING_MESSAGES[loadingStep]}
                </p>
              </div>
            )}

            {job && !busy && job.status === "failed" && (
              <p className="py-16 text-center text-sm text-destructive animate-fade-in-up">{job.error}</p>
            )}

            {job && !busy && job.status === "succeeded" && (
              <div className="space-y-4 animate-fade-in-up">
                {job.demo && <DemoBadge />}
                {job.url ? (
                  <video
                    src={job.url}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full rounded-2xl border border-border/70"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-2xl bg-primary-soft text-sm font-medium text-primary">
                    Aperçu vidéo en mode démo
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {job.url && (
                    <Button variant="outline" className="rounded-full" asChild>
                      <a href={job.url} download target="_blank" rel="noreferrer">
                        <Download className="size-4" /> Télécharger
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="rounded-full" onClick={() => mutation.mutate()}>
                    <RefreshCw className="size-4" /> Régénérer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
