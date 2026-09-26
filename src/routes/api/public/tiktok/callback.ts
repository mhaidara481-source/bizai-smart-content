import { createFileRoute } from "@tanstack/react-router";

function back(origin: string, status: string) {
  return Response.redirect(`${origin}/reseaux?tiktok=${encodeURIComponent(status)}`, 302);
}

export const Route = createFileRoute("/api/public/tiktok/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const state = url.searchParams.get("state") ?? "";
        const code = url.searchParams.get("code");
        if (url.searchParams.get("error")) return back(origin, "cancelled");
        if (!code || !/^[a-f0-9-]{40,80}$/i.test(state)) return back(origin, "invalid");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("social_oauth_states")
          .select("user_id, created_at")
          .eq("state", state)
          .maybeSingle();
        await supabaseAdmin.from("social_oauth_states").delete().eq("state", state);
        if (!row || Date.now() - new Date(row.created_at).getTime() > 15 * 60 * 1000) {
          return back(origin, "invalid");
        }
        try {
          const { completeTikTokConnection, getTikTokConfig, TIKTOK_CALLBACK_PATH } = await import(
            "@/lib/tiktok.server"
          );
          if (!getTikTokConfig().ready) return back(origin, "demo");
          await completeTikTokConnection(supabaseAdmin, row.user_id, code, `${origin}${TIKTOK_CALLBACK_PATH}`);
          return back(origin, "connected");
        } catch (error) {
          console.error("[tiktok] callback", error);
          return back(origin, "error");
        }
      },
    },
  },
});
