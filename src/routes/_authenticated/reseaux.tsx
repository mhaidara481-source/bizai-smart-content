import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { Facebook, Instagram, Loader2, Music2, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/app/PageHeader";
import { useSocialStatus } from "@/components/app/PublishPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { disconnectSocialAccount, startMetaConnect } from "@/lib/social.functions";
import { startTikTokConnect } from "@/lib/tiktok.functions";
import { useTikTokConfigured } from "@/components/app/TikTokPublishPanel";
import { pageHead } from "@/lib/seo";

const MESSAGES: Record<string, [string, "success" | "error" | "info"]> = {
  connected: ["Comptes connectés avec succès !", "success"],
  no_pages: ["Aucune page Facebook trouvée sur ce compte. Crée ou sélectionne une page.", "error"],
  cancelled: ["Connexion annulée.", "info"],
  invalid: ["Lien de connexion expiré. Réessaie.", "error"],
  error: ["Meta a refusé la connexion. Réessaie dans un instant.", "error"],
  demo: ["La connexion Meta n'est pas encore activée.", "info"],
};

export const Route = createFileRoute("/_authenticated/reseaux")({
  validateSearch: z.object({ meta: z.string().optional(), tiktok: z.string().optional() }),
  head: () =>
    pageHead({
      title: "Mes réseaux — BizAI",
      description: "Connecte Facebook et Instagram pour publier directement depuis BizAI.",
      path: "/reseaux",
      noindex: true,
    }),
  component: NetworksPage,
});

function NetworksPage() {
  const { meta, tiktok } = Route.useSearch();
  const { data: tiktokCfg, isLoading: tiktokLoading } = useTikTokConfigured();
  const connectTikTok = useServerFn(startTikTokConnect);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useSocialStatus();
  const connect = useServerFn(startMetaConnect);
  const disconnect = useServerFn(disconnectSocialAccount);

  useEffect(() => {
    if (!meta) return;
    const m = MESSAGES[meta];
    if (m) (m[1] === "success" ? toast.success : m[1] === "error" ? toast.error : toast)(m[0]);
    void queryClient.invalidateQueries({ queryKey: ["social-status"] });
    void navigate({ to: "/reseaux", search: {}, replace: true });
  }, [meta, navigate, queryClient]);

  useEffect(() => {
    if (!tiktok) return;
    const m: Record<string, [string, "success" | "error" | "info"]> = {
      connected: ["Compte TikTok connecté !", "success"],
      cancelled: ["Connexion TikTok annulée.", "info"],
      invalid: ["Lien de connexion expiré. Réessaie.", "error"],
      error: ["TikTok a refusé la connexion. Réessaie dans un instant.", "error"],
      demo: ["La connexion TikTok n'est pas encore activée.", "info"],
    };
    const msg = m[tiktok];
    if (msg) (msg[1] === "success" ? toast.success : msg[1] === "error" ? toast.error : toast)(msg[0]);
    void queryClient.invalidateQueries({ queryKey: ["social-status"] });
    void navigate({ to: "/reseaux", search: {}, replace: true });
  }, [tiktok, navigate, queryClient]);

  const tiktokMut = useMutation({
    mutationFn: () => connectTikTok(),
    onSuccess: (res) => {
      if (res.demo || !res.url) {
        toast("Mode démo : la connexion TikTok sera active une fois l'app TikTok validée.");
        return;
      }
      window.location.href = res.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const connectMut = useMutation({
    mutationFn: () => connect(),
    onSuccess: (res) => {
      if (res.demo || !res.url) {
        toast("Mode démo : la connexion sera active une fois la validation Meta terminée.");
        return;
      }
      window.location.href = res.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnectMut = useMutation({
    mutationFn: (id: string) => disconnect({ data: { id } }),
    onSuccess: () => {
      toast.success("Compte déconnecté.");
      void queryClient.invalidateQueries({ queryKey: ["social-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accounts = data?.accounts ?? [];
  const metaAccounts = accounts.filter((a) => a.platform !== "tiktok");
  const hasExpired = metaAccounts.some((a) => a.status === "expired");
  const tiktokAccounts = accounts.filter((a) => a.platform === "tiktok");

  return (
    <div>
      <PageHeader
        title="Mes réseaux"
        subtitle="Connecte ta page Facebook et ton compte Instagram professionnel pour publier en un clic."
      />

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <Card className="border-border/70">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft">
                <Share2 className="size-5 text-primary" />
              </span>
              <p className="font-semibold">Facebook & Instagram</p>
            </div>
            {!isLoading && !data?.configured && (
              <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Mode démo</span> — la publication
                directe sera active une fois la validation Meta terminée. Le reste de BizAI
                fonctionne normalement.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Il te faut une page Facebook, et pour Instagram un compte professionnel relié à
              cette page. Tu pourras choisir les pages autorisées pendant la connexion.
            </p>
            <Button
              className="w-full rounded-full"
              disabled={connectMut.isPending || isLoading}
              onClick={() => connectMut.mutate()}
            >
              {connectMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Facebook className="size-4" />
              )}
              {metaAccounts.length > 0 || hasExpired
                ? "Reconnecter Facebook & Instagram"
                : "Connecter Facebook & Instagram"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 md:order-last">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-soft">
                <Music2 className="size-5 text-primary" />
              </span>
              <p className="font-semibold">TikTok</p>
            </div>
            {!tiktokLoading && !tiktokCfg?.configured && (
              <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Mode démo</span> — la publication
                TikTok sera active une fois l'app TikTok validée.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              TikTok n'accepte que des vidéos : tu pourras publier depuis « Créer une vidéo ».
            </p>
            <Button
              className="w-full rounded-full"
              disabled={tiktokMut.isPending || tiktokLoading}
              onClick={() => tiktokMut.mutate()}
            >
              {tiktokMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Music2 className="size-4" />}
              {tiktokAccounts.length > 0 ? "Reconnecter TikTok" : "Connecter TikTok"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 md:row-span-2">
          <CardContent className="pt-6">
            <p className="font-semibold">Comptes connectés</p>
            {isLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
                Aucun compte connecté pour l'instant.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 animate-fade-in-up">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
                  >
                    {a.platform === "tiktok" ? (
                      <Music2 className="size-5 text-primary" />
                    ) : a.platform === "instagram" ? (
                      <Instagram className="size-5 text-primary" />
                    ) : (
                      <Facebook className="size-5 text-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.username ? `@${a.username}` : a.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.platform === "tiktok" ? "TikTok" : a.platform === "instagram" ? "Instagram" : "Page Facebook"} ·{" "}
                        {a.status === "active" ? "Actif" : "Connexion expirée"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Déconnecter ${a.name}`}
                      disabled={disconnectMut.isPending}
                      onClick={() => disconnectMut.mutate(a.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
