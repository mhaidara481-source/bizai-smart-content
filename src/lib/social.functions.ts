import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SocialAccount = {
  id: string;
  platform: "facebook" | "instagram";
  name: string;
  username: string | null;
  picture_url: string | null;
  status: "active" | "expired" | "revoked";
};

export const getSocialStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMetaConfig } = await import("./meta.server");
    const { data, error } = await context.supabase
      .from("social_accounts")
      .select("id, platform, name, username, picture_url, status")
      .order("platform")
      .order("name");
    if (error) throw new Error("Impossible de charger tes comptes connectés.");
    return { configured: getMetaConfig().ready, accounts: (data ?? []) as SocialAccount[] };
  });

export const startMetaConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMetaConfig, buildAuthUrl, CALLBACK_PATH } = await import("./meta.server");
    if (!getMetaConfig().ready) return { demo: true as const, url: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const state = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
    await supabaseAdmin.from("social_oauth_states").insert({ state, user_id: context.userId });
    const origin = new URL(getRequest().url).origin;
    return { demo: false as const, url: buildAuthUrl(state, `${origin}${CALLBACK_PATH}`) };
  });

export const disconnectSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("social_accounts").delete().eq("id", data.id);
    if (error) throw new Error("La déconnexion a échoué.");
    return { ok: true };
  });

const publishSchema = z.object({
  accountIds: z.array(z.string().uuid()).min(1).max(10),
  message: z.string().trim().min(1).max(2200),
  imageUrl: z.string().url().startsWith("https://").optional(),
});

export type PublishOutcome = {
  accountId: string;
  platform: string;
  name: string;
  status: "published" | "failed";
  permalink: string | null;
  error: string | null;
  expired?: boolean;
};

export const publishToSocial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => publishSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { getMetaConfig, publishToAccount, MetaApiError } = await import("./meta.server");
    if (!getMetaConfig().ready) {
      throw new Error(
        "Publication directe en mode démo : elle sera active une fois la validation Meta terminée.",
      );
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: accounts } = await supabaseAdmin
      .from("social_accounts")
      .select("id, platform, name, external_id, page_id, status")
      .eq("user_id", context.userId)
      .in("id", data.accountIds);
    if (!accounts?.length) throw new Error("Aucun compte connecté trouvé. Connecte tes réseaux.");

    const results: PublishOutcome[] = [];
    for (const account of accounts) {
      const { data: pub } = await supabaseAdmin
        .from("social_publications")
        .insert({
          user_id: context.userId,
          account_id: account.id,
          platform: account.platform,
          message: data.message,
          image_url: data.imageUrl ?? null,
        })
        .select("id")
        .single();
      const base = { accountId: account.id, platform: account.platform, name: account.name };
      try {
        if (account.status !== "active") {
          throw new MetaApiError("Connexion expirée. Reconnecte ce compte.", 190, true);
        }
        const { data: tok } = await supabaseAdmin
          .from("social_tokens")
          .select("access_token")
          .eq("account_id", account.id)
          .single();
        if (!tok) throw new MetaApiError("Connexion introuvable. Reconnecte ce compte.", 190, true);
        const res = await publishToAccount(account, tok.access_token, {
          accountId: account.id,
          message: data.message,
          imageUrl: data.imageUrl,
        });
        if (pub)
          await supabaseAdmin
            .from("social_publications")
            .update({
              status: "published",
              external_post_id: res.postId,
              permalink: res.permalink,
              updated_at: new Date().toISOString(),
            })
            .eq("id", pub.id);
        results.push({ ...base, status: "published", permalink: res.permalink, error: null });
      } catch (e) {
        const expired = e instanceof MetaApiError && e.expired;
        const message = e instanceof Error ? e.message : "Erreur inconnue.";
        if (expired)
          await supabaseAdmin.from("social_accounts").update({ status: "expired" }).eq("id", account.id);
        if (pub)
          await supabaseAdmin
            .from("social_publications")
            .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
            .eq("id", pub.id);
        results.push({ ...base, status: "failed", permalink: null, error: message, expired });
      }
    }
    return { results };
  });
