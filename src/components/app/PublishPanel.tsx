import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, Send, Share2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getSocialStatus,
  publishToSocial,
  type PublishOutcome,
} from "@/lib/social.functions";

export function useSocialStatus() {
  const fetchStatus = useServerFn(getSocialStatus);
  return useQuery({ queryKey: ["social-status"], queryFn: () => fetchStatus() });
}

export function PublishPanel({ message, imageUrl }: { message: string; imageUrl?: string }) {
  const { data, isLoading } = useSocialStatus();
  const queryClient = useQueryClient();
  const publish = useServerFn(publishToSocial);
  const [selected, setSelected] = useState<string[]>([]);
  const [results, setResults] = useState<PublishOutcome[] | null>(null);

  const publishable = imageUrl?.startsWith("https://") ? imageUrl : undefined;
  const accounts = (data?.accounts ?? []).filter(
    (a) => a.status === "active" && (a.platform === "facebook" || publishable),
  );
  const expired = (data?.accounts ?? []).some((a) => a.status === "expired");

  useEffect(() => {
    setResults(null);
  }, [message, imageUrl]);

  const mutation = useMutation({
    mutationFn: () =>
      publish({ data: { accountIds: selected, message, imageUrl: publishable } }),
    onSuccess: ({ results }) => {
      setResults(results);
      const ok = results.filter((r) => r.status === "published").length;
      if (ok === results.length) toast.success("Publié !");
      else if (ok > 0) toast.warning("Publication partielle, vérifie les détails.");
      else toast.error("La publication a échoué.");
      if (results.some((r) => r.expired)) void queryClient.invalidateQueries({ queryKey: ["social-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return null;

  const box = "rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm";

  if (!data?.configured) {
    return (
      <div className={box}>
        <p className="flex items-center gap-2 font-semibold">
          <Share2 className="size-4 text-primary" /> Publication directe — Mode démo
        </p>
        <p className="mt-1 text-muted-foreground">
          La publication sur Instagram et Facebook sera active une fois la validation Meta
          terminée. En attendant, copie ou télécharge ton contenu.
        </p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={box}>
        <p className="font-semibold">
          {expired ? "Ta connexion a expiré" : "Publie directement sur tes réseaux"}
        </p>
        <p className="mt-1 text-muted-foreground">
          {expired
            ? "Reconnecte Facebook & Instagram pour publier."
            : (data.accounts.length > 0 && !publishable)
              ? "Instagram exige une image : génère un visuel, ou connecte une page Facebook."
              : "Connecte ta page Facebook et ton compte Instagram pour publier en un clic."}
        </p>
        <Button asChild size="sm" className="mt-3 rounded-full">
          <Link to="/reseaux">Connecter mes réseaux</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className="flex items-center gap-2 font-semibold">
        <Share2 className="size-4 text-primary" /> Publier directement
      </p>
      <div className="mt-3 space-y-2">
        {accounts.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={selected.includes(a.id)}
              onCheckedChange={(v) =>
                setSelected((s) => (v ? [...s, a.id] : s.filter((x) => x !== a.id)))
              }
            />
            <span className="capitalize text-muted-foreground">{a.platform}</span>
            <span className="font-medium">{a.username ? `@${a.username}` : a.name}</span>
          </label>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3 rounded-full"
        disabled={selected.length === 0 || mutation.isPending || !message.trim()}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Publication en cours…
          </>
        ) : (
          <>
            <Send className="size-4" /> Publier sur Instagram/Facebook
          </>
        )}
      </Button>
      {results && (
        <ul className="mt-3 space-y-1.5 animate-fade-in-up">
          {results.map((r) => (
            <li key={r.accountId} className="flex items-start gap-2">
              {r.status === "published" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              )}
              <span>
                <span className="font-medium">{r.name}</span>{" "}
                {r.status === "published" ? (
                  r.permalink ? (
                    <a href={r.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">
                      Voir le post <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    "publié"
                  )
                ) : (
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
