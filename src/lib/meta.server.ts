// Intégration Meta (Facebook Login for Business + Instagram Graph API) — serveur uniquement.
// Les jetons ne quittent jamais le serveur : ils sont stockés dans social_tokens (aucun accès client).

export const GRAPH_VERSION = "v21.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
];

export const CALLBACK_PATH = "/api/public/meta/callback";

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

export function getMetaConfig() {
  const appId = process.env["META_APP_ID"]?.trim();
  const appSecret = process.env["META_APP_SECRET"]?.trim();
  const configId = process.env["META_CONFIG_ID"]?.trim();
  const ready = Boolean(appId && appSecret && /^\d+$/.test(appId ?? ""));
  return { ready, appId: appId ?? "", appSecret: appSecret ?? "", configId };
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public expired = false,
  ) {
    super(message);
  }
}

type GraphError = { error?: { message?: string; code?: number; error_subcode?: number } };

function friendlyError(err: GraphError["error"], status: number): MetaApiError {
  const code = err?.code;
  if (code === 190 || code === 102) {
    return new MetaApiError(
      "Ta connexion Facebook/Instagram a expiré. Reconnecte ton compte pour publier.",
      code,
      true,
    );
  }
  if (code === 10 || code === 200 || (code && code >= 200 && code < 300)) {
    return new MetaApiError(
      "Permission refusée par Meta. Reconnecte ton compte en acceptant toutes les autorisations.",
      code,
    );
  }
  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return new MetaApiError("Meta limite temporairement les publications. Réessaie plus tard.", code);
  }
  if (code === 9004 || code === 36003) {
    return new MetaApiError(
      "Meta n'a pas pu récupérer l'image. Utilise un visuel JPG/PNG récent (moins de 8 Mo).",
      code,
    );
  }
  console.error("[meta] erreur Graph", status, err);
  return new MetaApiError(
    `Meta a refusé la publication${err?.message ? ` : ${err.message}` : "."}`,
    code,
  );
}

async function graph<T>(
  path: string,
  params: Record<string, string>,
  method: "GET" | "POST" = "GET",
): Promise<T> {
  const body = new URLSearchParams(params);
  const url = method === "GET" ? `${GRAPH}${path}?${body}` : `${GRAPH}${path}`;
  const res = await fetch(url, {
    method,
    headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {},
    body: method === "POST" ? body.toString() : null,
  });
  const json = (await res.json().catch(() => ({}))) as T & GraphError;
  if (!res.ok || json.error) throw friendlyError(json.error, res.status);
  return json;
}

export function buildAuthUrl(state: string, redirectUri: string) {
  const { appId, configId } = getMetaConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
  });
  if (configId) {
    params.set("config_id", configId);
    params.set("override_default_response_type", "true");
  } else {
    params.set("scope", META_SCOPES.join(","));
  }
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`;
}

/** Échange le code OAuth, récupère les pages + comptes Instagram et les enregistre. */
export async function completeConnection(
  admin: SupabaseAdmin,
  userId: string,
  code: string,
  redirectUri: string,
): Promise<number> {
  const { appId, appSecret } = getMetaConfig();
  const short = await graph<{ access_token: string }>("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const long = await graph<{ access_token: string; expires_in?: number }>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: short.access_token,
  });
  const userToken = long.access_token;
  const userExpires = long.expires_in
    ? new Date(Date.now() + long.expires_in * 1000).toISOString()
    : null;

  const pages = await graph<{
    data: {
      id: string;
      name: string;
      access_token: string;
      picture?: { data?: { url?: string } };
      instagram_business_account?: {
        id: string;
        username?: string;
        name?: string;
        profile_picture_url?: string;
      };
    }[];
  }>("/me/accounts", {
    access_token: userToken,
    fields:
      "id,name,access_token,picture{url},instagram_business_account{id,username,name,profile_picture_url}",
    limit: "100",
  });

  let count = 0;
  for (const page of pages.data ?? []) {
    const entries = [
      {
        platform: "facebook",
        external_id: page.id,
        name: page.name,
        username: null as string | null,
        picture_url: page.picture?.data?.url ?? null,
      },
    ];
    const ig = page.instagram_business_account;
    if (ig) {
      entries.push({
        platform: "instagram",
        external_id: ig.id,
        name: ig.name ?? ig.username ?? page.name,
        username: ig.username ?? null,
        picture_url: ig.profile_picture_url ?? null,
      });
    }
    for (const entry of entries) {
      const { data: account, error } = await admin
        .from("social_accounts")
        .upsert(
          {
            user_id: userId,
            ...entry,
            page_id: page.id,
            status: "active",
            // Les jetons de page issus d'un jeton long ne expirent pas ; on garde l'échéance utilisateur à titre indicatif.
            token_expires_at: userExpires,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,platform,external_id" },
        )
        .select("id")
        .single();
      if (error || !account) throw new Error("Impossible d'enregistrer le compte connecté.");
      await admin.from("social_tokens").upsert({
        account_id: account.id,
        user_id: userId,
        access_token: page.access_token,
        user_access_token: userToken,
        updated_at: new Date().toISOString(),
      });
      count++;
    }
  }
  return count;
}

export type PublishInput = {
  accountId: string;
  message: string;
  imageUrl?: string | undefined;
};

export type PublishResult = { status: "published"; permalink: string | null; postId: string };

async function waitForContainer(containerId: string, token: string) {
  for (let i = 0; i < 10; i++) {
    const s = await graph<{ status_code?: string }>(`/${containerId}`, {
      fields: "status_code",
      access_token: token,
    });
    if (s.status_code === "FINISHED" || !s.status_code) return;
    if (s.status_code === "ERROR" || s.status_code === "EXPIRED") {
      throw new MetaApiError("Instagram n'a pas pu traiter l'image. Essaie avec un autre visuel.");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new MetaApiError("Instagram met trop de temps à traiter l'image. Réessaie dans un instant.");
}

/** Publie sur la page Facebook ou le compte Instagram indiqué. */
export async function publishToAccount(
  account: { platform: string; external_id: string; page_id: string },
  token: string,
  input: PublishInput,
): Promise<PublishResult> {
  if (account.platform === "facebook") {
    if (input.imageUrl) {
      const res = await graph<{ id: string; post_id?: string }>(
        `/${account.page_id}/photos`,
        { url: input.imageUrl, caption: input.message, access_token: token },
        "POST",
      );
      const id = res.post_id ?? res.id;
      return { status: "published", postId: id, permalink: `https://www.facebook.com/${id}` };
    }
    const res = await graph<{ id: string }>(
      `/${account.page_id}/feed`,
      { message: input.message, access_token: token },
      "POST",
    );
    return { status: "published", postId: res.id, permalink: `https://www.facebook.com/${res.id}` };
  }

  if (!input.imageUrl) {
    throw new MetaApiError("Instagram exige une image. Ajoute un visuel pour publier sur Instagram.");
  }
  const container = await graph<{ id: string }>(
    `/${account.external_id}/media`,
    { image_url: input.imageUrl, caption: input.message, access_token: token },
    "POST",
  );
  await waitForContainer(container.id, token);
  const published = await graph<{ id: string }>(
    `/${account.external_id}/media_publish`,
    { creation_id: container.id, access_token: token },
    "POST",
  );
  const info = await graph<{ permalink?: string }>(`/${published.id}`, {
    fields: "permalink",
    access_token: token,
  }).catch(() => ({ permalink: undefined }));
  return { status: "published", postId: published.id, permalink: info.permalink ?? null };
}
