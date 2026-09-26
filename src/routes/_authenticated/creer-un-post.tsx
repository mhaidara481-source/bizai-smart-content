import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePost } from "@/lib/ai.functions";
import {
  BUSINESS_TYPES,
  LANGUAGES,
  LIMIT_REACHED_MESSAGE,
  PLATFORMS,
  TONES,
  type PostResult,
} from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/creer-un-post")({
  head: () => ({
    meta: [
      { title: "Créer un post — BizAI" },
      {
        name: "description",
        content:
          "Génère une publication prête à publier pour Instagram, Facebook, TikTok ou LinkedIn.",
      },
      { property: "og:title", content: "Créer un post — BizAI" },
      {
        property: "og:description",
        content: "Des publications prêtes à publier en quelques secondes.",
      },
    ],
  }),
  component: CreatePost,
});

function CreatePost() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const run = useServerFn(generatePost);

  const [businessType, setBusinessType] = useState<string>(profile?.business_type ?? "Restaurant");
  const [platform, setPlatform] = useState<string>("Instagram");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<string>("Amical");
  const [language, setLanguage] = useState<string>("Français");

  const [result, setResult] = useState<PostResult | null>(null);
  const [demo, setDemo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      run({ data: { businessType, platform, topic: topic.trim(), tone, language } }),
    onSuccess: (res) => {
      setResult(res.data);
      setDemo(res.demo);
      setEditing(false);
      setLimitReached(false);
      void queryClient.invalidateQueries();
      toast.success("Post généré !");
    },
    onError: (error: Error) => {
      if (error.message.includes("limite mensuelle")) {
        setLimitReached(true);
        return;
      }
      toast.error(error.message || "La génération a échoué.");
    },
  });

  const canSubmit = topic.trim().length >= 3 && !mutation.isPending;

  const fullText = result
    ? `${result.hook}\n\n${result.body}\n\n${result.cta}\n\n${result.hashtags.join(" ")}`
    : "";

  async function copy() {
    await navigator.clipboard.writeText(fullText);
    toast.success("Copié dans le presse-papier");
  }

  return (
    <div>
      <PageHeader
        title="Créer un post"
        subtitle="Décris ton sujet, BizAI rédige la publication complète."
      />

      {limitReached && (
        <div className="mb-6">
          <LimitReached message={LIMIT_REACHED_MESSAGE} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="border-border/70">
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Sujet</Label>
              <Input
                id="topic"
                placeholder="Ex : nouvelle formule déjeuner à 14€"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ton</Label>
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
                  <Sparkles className="size-4" /> Générer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardContent className="pt-6">
            {!result && !mutation.isPending && (
              <div className="flex flex-col items-center py-16 text-center animate-fade-in-up">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft">
                  <Sparkles className="size-5 text-primary" />
                </span>
                <p className="mt-4 font-semibold">Ton post apparaîtra ici</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Remplis le formulaire et clique sur Générer.
                </p>
              </div>
            )}

            {mutation.isPending && (
              <div className="space-y-6 py-4" aria-label="Génération du post en cours">
                <div className="space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-6 w-4/5" /></div>
                <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[94%]" /><Skeleton className="h-4 w-3/4" /></div>
                <Skeleton className="h-9 w-44 rounded-full" />
              </div>
            )}

            {result && !mutation.isPending && (
              <div className="space-y-5 animate-fade-in-up">
                {demo && <DemoBadge />}
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Accroche</p>
                  <p className="mt-1 font-semibold">{result.hook}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Texte du post
                  </p>
                  {editing ? (
                    <Textarea
                      className="mt-1 min-h-40"
                      value={result.body}
                      onChange={(e) => setResult({ ...result, body: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {result.body}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Appel à l'action
                  </p>
                  <p className="mt-1 text-sm">{result.cta}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Hashtags</p>
                  <p className="mt-1 text-sm text-primary">{result.hashtags.join(" ")}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={copy}>
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
                  <Button
                    variant={editing ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setEditing((v) => !v)}
                  >
                    <Pencil className="size-4" /> {editing ? "Terminer" : "Modifier"}
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
