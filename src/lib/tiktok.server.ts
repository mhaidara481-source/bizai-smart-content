// Intégration TikTok (Login Kit + Content Posting API) — serveur uniquement.
// Chaque utilisateur BizAI connecte SON compte TikTok : les jetons restent dans social_tokens.

const API = "https://open.tiktokapis.com/v2";
export const TIKTOK_SCOPES = ["user.info.basic", "video.publish"];
export const TIKTOK_CALLBACK_PATH = "/api/public/tiktok/callback";

type SupabaseAdmin = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

export function getTikTokConfig() {
  const clientKey = process.env["TIKTOK_CLIENT_KEY"]?.trim() ?? "";
  const clientSecret = process.env["TIKTOK_CLIENT_SECRET"]?.trim() ?? "";
  return { ready: Boolean(clientKey && clientSecret), clientKey, clientSecret };
}

export class TikTokError extends Error {
  constructor(
    message: string,
    public expired = false,
  ) {
    super(message);
  }
}

function friendly(code: string | undefined, raw?: string): TikTokError {
  switch (code) {
    case "access_token_invalid":
    case "invalid_grant":
    case "token_expired":
      return new TikTokError("Ta connexion TikTok a expiré. Reconnecte ton compte.", true);
    case "scope_not_authorized":
      return new TikTokError(
        "Autorisation de publication refusée. Reconnecte TikTok en acceptant la publication de vidéos.",
        true,
      );
    case "rate_limit_exceeded":
    case "spam_risk_too_many_posts":
    case "spam_risk_user_banned_from_posting":
      return new TikTokError("TikTok limite temporairement les publications. Réessaie plus tard.");
    case "unaudited_client_can_only_post_to_private_accounts":
      return new TikTokError(
        "L'app TikTok n'est pas encore validée : la publication n'est possible que vers un compte privé.",
      );
    default:
      console.error("[tiktok] erreur", code, raw);
      return new TikTokError(`TikTok a refusé la demande${raw ? ` : ${raw}` : "."}`);
  }
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  open_id?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(params: Record<string, string>): Promise<Required<Pick<TokenResponse, "access_token" | "refresh_token" | "expires_in" | "open_id">>> {
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse;
  if (!res.ok || json.error || !json.access_token) {
    throw friendly(json.error, json.error_description);
  }
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token ?? "",
    expires_in: json.expires_in ?? 86400,
    open_id: json.open_id ?? "",
  };
}

async function api<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: body === undefined ? null : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { code?: string; message?: string };
  };
  if (!res.ok || (json.error?.code && json.error.code !== "ok")) {
    throw friendly(json.error?.code, json.error?.message);
  }
  return json.data as T;
}

export function buildTikTokAuthUrl(state: string, redirectUri: string) {
  const { clientKey } = getTikTokConfig();
  const p = new URLSearchParams({
    client_key: clientKey,
    scope: TIKTOK_SCOPES.join(","),
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${p}`;
}

export async function completeTikTokConnection(
  admin: SupabaseAdmin,
  userId: string,
  code: string,
  redirectUri: string,
) {
  const { clientKey, clientSecret } = getTikTokConfig();
  const tok = await tokenRequest({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const info = await api<{ user?: { open_id?: string; display_name?: string; avatar_url?: string } }>(
    "/user/info/?fields=open_id,display_name,avatar_url",
    tok.access_token,
  ).catch(() => ({ user: undefined }));

  const { data: account, error } = await admin
    .from("social_accounts")
    .upsert(
      {
        user_id: userId,
        platform: "tiktok",
        external_id: tok.open_id,
        page_id: tok.open_id,
        name: info.user?.display_name ?? "Compte TikTok",
        username: null,
        picture_url: info.user?.avatar_url ?? null,
        status: "active",
        token_expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,external_id" },
    )
    .select("id")
    .single();
  if (error || !account) throw new Error("Impossible d'enregistrer le compte TikTok.");
  await admin.from("social_tokens").upsert({
    account_id: account.id,
    user_id: userId,
    access_token: tok.access_token,
    refresh_token: tok.refresh_token,
    updated_at: new Date().toISOString(),
  });
}

/** Renvoie un jeton valide (le jeton TikTok expire après 24 h, on le rafraîchit si besoin). */
export async function getValidTikTokToken(
  admin: SupabaseAdmin,
  account: { id: string; token_expires_at: string | null },
): Promise<string> {
  const { data: row } = await admin
    .from("social_tokens")
    .select("access_token, refresh_token")
    .eq("account_id", account.id)
    .single();
  if (!row) throw new TikTokError("Connexion TikTok introuvable. Reconnecte ton compte.", true);
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  if (expiresAt - Date.now() > 5 * 60 * 1000) return row.access_token;
  if (!row.refresh_token) throw new TikTokError("Ta connexion TikTok a expiré. Reconnecte ton compte.", true);

  const { clientKey, clientSecret } = getTikTokConfig();
  const tok = await tokenRequest({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });
  await admin
    .from("social_tokens")
    .update({
      access_token: tok.access_token,
      refresh_token: tok.refresh_token || row.refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account.id);
  await admin
    .from("social_accounts")
    .update({ token_expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString() })
    .eq("id", account.id);
  return tok.access_token;
}

/** Envoie la vidéo (fichier) à TikTok puis attend la fin du traitement. */
export async function publishTikTokVideo(token: string, video: ArrayBuffer, caption: string) {
  const creator = await api<{ privacy_level_options?: string[] }>(
    "/post/publish/creator_info/query/",
    token,
    {},
  );
  const options = creator.privacy_level_options ?? [];
  const privacy = options.includes("PUBLIC_TO_EVERYONE")
    ? "PUBLIC_TO_EVERYONE"
    : (options[0] ?? "SELF_ONLY");

  const size = video.byteLength;
  const init = await api<{ publish_id: string; upload_url: string }>(
    "/post/publish/video/init/",
    token,
    {
      post_info: { title: caption.slice(0, 2200), privacy_level: privacy },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: size,
        chunk_size: size,
        total_chunk_count: 1,
      },
    },
  );

  const up = await fetch(init.upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body: video,
  });
  if (!up.ok) throw new TikTokError(`L'envoi de la vidéo à TikTok a échoué (${up.status}).`);

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const s = await api<{ status?: string; fail_reason?: string }>(
      "/post/publish/status/fetch/",
      token,
      { publish_id: init.publish_id },
    );
    if (s.status === "PUBLISH_COMPLETE") return { publishId: init.publish_id, processing: false, privacy };
    if (s.status === "FAILED") throw friendly(s.fail_reason, s.fail_reason);
  }
  // Toujours en traitement côté TikTok : la vidéo apparaîtra sous peu.
  return { publishId: init.publish_id, processing: true, privacy };
}
