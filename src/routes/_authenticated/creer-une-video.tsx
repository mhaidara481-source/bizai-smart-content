import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { TikTokPublishPanel } from "@/components/app/TikTokPublishPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkVideoFn, getVideoQuotaFn, listVideosFn, startVideoFn } from "@/lib/video.functions";
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
type VideoFormat = "vertical" | "horizontal";
const FORMAT_OPTIONS: { value: VideoFormat; label: string }[] = [
  { value: "vertical", label: "Vertical (Instagram, TikTok)" },
  { value: "horizontal", label: "Horizontal (YouTube, site web)" },
];
const STATUS_LABELS = { pending: "En cours", succeeded: "Prête", failed: "Échouée" } as const;

function CreateVideo() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const start = useServerFn(startVideoFn);
  const check = useServerFn(checkVideoFn);
  const fetchQuota = useServerFn(getVideoQuotaFn);

  const fetchHistory = useServerFn(listVideosFn);
  const quota = useQuery({ queryKey: ["video-quota"], queryFn: () => fetchQuota() });
  const history = useQuery({ queryKey: ["video-history"], queryFn: () => fetchHistory() });

  const [businessType, setBusinessType] = useState<string>(profile?.business_type ?? "Restaurant");
  const [subject, setSubject] = useState("");
  const [format, setFormat] = useState<VideoFormat>("vertical");
  const [jobVertical, setJobVertical] = useState(true);
  const resumed = useRef(false);
  const [job, setJob] = useState<JobState | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const polling = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWorking = job?.status === "pending";

  // Reprend la progression d'une vidéo encore en cours au retour sur la page.
  useEffect(() => {
    if (resumed.current || job || !history.data) return;
    resumed.current = true;
    const pending = history.data.find((v) => v.status === "pending");
    if (pending) {
      setJobVertical(pending.vertical);
      setJob({ jobId: pending.id, status: "pending", url: null, demo: pending.demo, error: null, remaining: quota.data?.remaining ?? 0 });
    }
  }, [history.data, job, quota.data]);

  const mutation = useMutation({
    mutationFn: () => start({ data: { businessType, subject: subject.trim(), format } }),
    onSuccess: (res) => {
      setJobVertical(format === "vertical");
      setJob(res);
      void queryClient.invalidateQueries({ queryKey: ["video-history"] });
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
          void queryClient.invalidateQueries({ queryKey: ["video-history"] });
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
  const previewVertical = mutation.isPending ? format === "vertical" : jobVertical;
  const ratioClass = previewVertical ? "mx-auto aspect-[9/16] max-h-[70vh]" : "aspect-video w-full";

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

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
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
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as VideoFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
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
                <Skeleton className={`${ratioClass} rounded-2xl`} />
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
                    className={`${ratioClass} rounded-2xl border border-border/70 bg-muted object-cover`}
                  />
                ) : (
                  <div className={`${ratioClass} flex items-center justify-center rounded-2xl bg-primary-soft text-sm font-medium text-primary`}>
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
                <TikTokPublishPanel jobId={job.jobId} demoVideo={job.demo || !job.url} defaultCaption={subject} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Mes vidéos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tes 12 dernières vidéos.</p>
        {history.isLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
            ))}
          </div>
        ) : !history.data?.length ? (
          <Card className="mt-4 border-border/70">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aucune vidéo pour l'instant. Ta première vidéo apparaîtra ici.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.data.map((v) => (
              <Card key={v.id} className="border-border/70 animate-fade-in-up">
                <CardContent className="space-y-3 pt-6">
                  {v.url ? (
                    <video
                      src={v.url}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className={`${v.vertical ? "mx-auto aspect-[9/16] max-h-80" : "aspect-video w-full"} rounded-xl border border-border/70 bg-muted object-cover`}
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                      {v.status === "pending" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : v.demo ? (
                        "Mode démo"
                      ) : (
                        "Aperçu indisponible"
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        v.status === "failed"
                          ? "bg-destructive/10 text-destructive"
                          : v.status === "pending"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary-soft text-primary"
                      }`}
                    >
                      {STATUS_LABELS[v.status]}
                    </span>
                  </div>
                  {v.status === "succeeded" && v.url && (
                    <Button variant="outline" size="sm" className="w-full rounded-full" asChild>
                      <a href={v.url} download target="_blank" rel="noreferrer">
                        <Download className="size-4" /> Télécharger
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
