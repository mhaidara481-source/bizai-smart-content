import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Music2, Send, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useSocialStatus } from "@/components/app/PublishPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getTikTokConfigured,
  publishVideoToTikTok,
  type TikTokOutcome,
} from "@/lib/tiktok.functions";

export function useTikTokConfigured() {
  const fn = useServerFn(getTikTokConfigured);
  return useQuery({ queryKey: ["tiktok-configured"], queryFn: () => fn() });
}

export function TikTokPublishPanel({
  jobId,
  demoVideo,
  defaultCaption,
}: {
  jobId: string;
  demoVideo: boolean;
  defaultCaption: string;
}) {
  const { data: status, isLoading } = useSocialStatus();
  const { data: cfg, isLoading: cfgLoading } = useTikTokConfigured();
  const queryClient = useQueryClient();
  const publish = useServerFn(publishVideoToTikTok);
  const [caption, setCaption] = useState(defaultCaption);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<TikTokOutcome[] | null>(null);

  useEffect(() => setResults(null), [jobId]);

  const all = (status?.accounts ?? []).filter((a) => a.platform === "tiktok");
  const accounts = all.filter((a) => a.status === "active");

  const mutation = useMutation({
    mutationFn: () => publish({ data: { jobId, accountIds: selected, caption } }),
    onSuccess: ({ results }) => {
      setResults(results);
      const ok = results.filter((r) => r.status !== "failed").length;
      if (ok === results.length) toast.success("Vidéo envoyée sur TikTok !");
      else toast.error("La publication TikTok a échoué.");
      if (results.some((r) => r.expired)) void queryClient.invalidateQueries({ queryKey: ["social-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || cfgLoading) return null;
  const box = "rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm";
  const title = (
    <p className="flex items-center gap-2 font-semibold">
      <Music2 className="size-4 text-primary" /> Publier sur TikTok
      {!cfg?.configured && " — Mode démo"}
    </p>
  );

  if (!cfg?.configured) {
    return (
      <div className={box}>
        {title}
        <p className="mt-1 text-muted-foreground">
          La publication sur TikTok sera active une fois l'app TikTok validée. En attendant,
          télécharge ta vidéo.
        </p>
      </div>
    );
  }

  if (demoVideo) {
    return (
      <div className={box}>
        {title}
        <p className="mt-1 text-muted-foreground">Les vidéos de démonstration ne peuvent pas être publiées.</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    const expired = all.some((a) => a.status === "expired");
    return (
      <div className={box}>
        {title}
        <p className="mt-1 text-muted-foreground">
          {expired ? "Ta connexion TikTok a expiré. Reconnecte ton compte." : "Connecte ton compte TikTok pour publier ta vidéo en un clic."}
        </p>
        <Button asChild size="sm" className="mt-3 rounded-full">
          <Link to="/reseaux">{expired ? "Reconnecter TikTok" : "Connecter TikTok"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={box}>
      {title}
      <div className="mt-3 space-y-2">
        <Label htmlFor="tt-caption">Légende</Label>
        <Textarea
          id="tt-caption"
          className="min-h-20 bg-background"
          value={caption}
          maxLength={2200}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>
      <div className="mt-3 space-y-2">
        {accounts.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={selected.includes(a.id)}
              onCheckedChange={(v) => setSelected((s) => (v ? [...s, a.id] : s.filter((x) => x !== a.id)))}
            />
            <span className="font-medium">{a.name}</span>
          </label>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3 rounded-full"
        disabled={selected.length === 0 || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Envoi à TikTok…
          </>
        ) : (
          <>
            <Send className="size-4" /> Publier sur TikTok
          </>
        )}
      </Button>
      {results && (
        <ul className="mt-3 space-y-1.5 animate-fade-in-up">
          {results.map((r) => (
            <li key={r.accountId} className="flex items-start gap-2">
              {r.status === "published" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : r.status === "processing" ? (
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <span>
                <span className="font-medium">{r.name}</span>{" "}
                {r.status === "published" && (
                  <>publiée{r.privateOnly ? " (visible par toi seul pour l'instant)" : ""} — retrouve-la dans ton profil TikTok.</>
                )}
                {r.status === "processing" && "envoyée, TikTok termine le traitement. Elle apparaîtra dans quelques minutes."}
                {r.status === "failed" && (
                  <span className="text-muted-foreground">
                    — {r.error}{" "}
                    {r.expired && (
                      <Link to="/reseaux" className="text-primary hover:underline">
                        Reconnecter
                      </Link>
                    )}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
