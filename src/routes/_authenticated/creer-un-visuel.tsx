import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, ImageIcon, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateVisualImage } from "@/lib/visual.functions";
import {
  BUSINESS_TYPES,
  LIMIT_REACHED_MESSAGE,
  VISUAL_FORMATS,
  VISUAL_STYLES,
  type VisualResult,
} from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/creer-un-visuel")({
  head: () => ({
    meta: [
      { title: "Créer un visuel — BizAI" },
      {
        name: "description",
        content:
          "Génère une image marketing professionnelle pour tes publications en quelques secondes.",
      },
      { property: "og:title", content: "Créer un visuel — BizAI" },
      {
        property: "og:description",
        content: "Des visuels prêts à publier, générés par l'IA pour ton entreprise.",
      },
    ],
  }),
  component: CreateVisual,
});

function CreateVisual() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const run = useServerFn(generateVisualImage);

  const [businessType, setBusinessType] = useState<string>(profile?.business_type ?? "Restaurant");
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState<string>("Photo réaliste");
  const [format, setFormat] = useState<string>("Carré (post)");

  const [result, setResult] = useState<VisualResult | null>(null);
  const [demo, setDemo] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_MESSAGES = [
    "Analyse de ta demande…",
    "Création de ton visuel professionnel…",
    "Finalisation des détails…",
  ];


  const mutation = useMutation({
    mutationFn: async () =>
      run({ data: { businessType, subject: subject.trim(), style, format } }),
    onSuccess: (res) => {
      setResult(res.data);
      setDemo(res.demo);
      setLimitReached(false);
      void queryClient.invalidateQueries();
      toast.success("Visuel généré !");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle")) {
        setLimitReached(true);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  useEffect(() => {
    if (!mutation.isPending) {
      setLoadingStep(0);
      return;
    }
    const timer = setInterval(
      () => setLoadingStep((s) => (s + 1) % LOADING_MESSAGES.length),
      3500,
    );
    return () => clearInterval(timer);
  }, [mutation.isPending, LOADING_MESSAGES.length]);


  const canSubmit = subject.trim().length >= 3 && !mutation.isPending;

  return (
    <div>
      <PageHeader
        title="Créer un visuel"
        subtitle="Décris ton image, BizAI génère un visuel prêt à publier."
      />

      {limitReached && (
        <div className="mb-6">
          <LimitReached message={LIMIT_REACHED_MESSAGE} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardContent className="space-y-5 pt-6">
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
              <Label htmlFor="subject">Que veux-tu montrer ?</Label>
              <Input
                id="subject"
                placeholder="Ex : un burger maison avec des frites sur une table en bois"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUAL_STYLES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISUAL_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full rounded-full"
              disabled={!canSubmit}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Génération…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Générer le visuel
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Chaque visuel généré compte dans ton quota mensuel de générations.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardContent className="pt-6">
            {!result && !mutation.isPending && (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <ImageIcon className="size-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Ton visuel apparaîtra ici</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Décris ce que tu veux montrer et clique sur Générer.
                </p>
              </div>
            )}

            {mutation.isPending && (
              <div className="flex flex-col items-center py-16 text-center">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p
                  key={loadingStep}
                  className="mt-4 text-sm text-muted-foreground transition-opacity duration-500 animate-fade-in"
                >
                  {LOADING_MESSAGES[loadingStep]}
                </p>
              </div>
            )}

            {result && !mutation.isPending && (
              <div className="space-y-4">
                {demo && <DemoBadge />}
                <img
                  src={result.url}
                  alt={`Visuel marketing généré pour ${businessType} : ${subject}`}
                  className="w-full rounded-2xl border border-border/70 object-cover"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={result.url} download target="_blank" rel="noreferrer">
                      <Download className="size-4" /> Télécharger
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate()}
                  >
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
