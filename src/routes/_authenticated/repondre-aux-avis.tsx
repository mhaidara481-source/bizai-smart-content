import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, MessageSquareQuote, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateReviewReply } from "@/lib/ai.functions";
import { BUSINESS_TYPES, LANGUAGES, TONES, type ReviewResult } from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/repondre-aux-avis")({
  head: () => ({
    meta: [
      { title: "Répondre aux avis — BizAI" },
      {
        name: "description",
        content: "Réponds à tes avis clients avec des messages naturels et professionnels.",
      },
      { property: "og:title", content: "Répondre aux avis — BizAI" },
      { property: "og:description", content: "Des réponses professionnelles à tes avis en un clic." },
    ],
  }),
  component: ReviewsPage,
});

const SENTIMENT_STYLES: Record<string, string> = {
  positif: "bg-primary-soft text-primary",
  neutre: "bg-muted text-muted-foreground",
  "négatif": "bg-destructive/10 text-destructive",
};

function ReviewsPage() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const run = useServerFn(generateReviewReply);

  const [businessType, setBusinessType] = useState(profile?.business_type ?? "Restaurant");
  const [review, setReview] = useState("");
  const [tone, setTone] = useState("Professionnel");
  const [language, setLanguage] = useState("Français");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [demo, setDemo] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      run({ data: { businessType, review: review.trim(), tone, language } }),
    onSuccess: (res) => {
      setResult(res.data);
      setDemo(res.demo);
      setLimitReached(false);
      void queryClient.invalidateQueries();
      toast.success("Réponse générée !");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle")) {
        setLimitReached(true);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  const canSubmit = review.trim().length >= 5 && !mutation.isPending;

  return (
    <div>
      <PageHeader
        title="Répondre aux avis"
        subtitle="Colle l'avis d'un client, BizAI rédige une réponse adaptée."
      />

      {limitReached && (
        <div className="mb-6">
          <LimitReached />
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
              <Label htmlFor="review">Avis du client</Label>
              <Textarea
                id="review"
                className="min-h-40"
                placeholder="Colle ici l'avis reçu sur Google, Facebook…"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ton de la réponse</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
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
                  <MessageSquareQuote className="size-4" /> Générer une réponse
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardContent className="pt-6">
            {!result && !mutation.isPending && (
              <div className="flex flex-col items-center py-16 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <MessageSquareQuote className="size-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Ta réponse apparaîtra ici</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  BizAI détecte le ressenti du client et adapte le message.
                </p>
              </div>
            )}

            {mutation.isPending && (
              <div className="flex flex-col items-center py-16 text-center">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">BizAI rédige la réponse…</p>
              </div>
            )}

            {result && !mutation.isPending && (
              <div className="space-y-5">
                {demo && <DemoBadge />}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Ressenti détecté
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      SENTIMENT_STYLES[result.sentiment] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {result.sentiment}
                  </span>
                </div>
                <Textarea
                  className="min-h-56"
                  value={result.reply}
                  onChange={(e) => setResult({ ...result, reply: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={async () => {
                      await navigator.clipboard.writeText(result.reply);
                      toast.success("Copié dans le presse-papier");
                    }}
                  >
                    <Copy className="size-4" /> Copier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
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
