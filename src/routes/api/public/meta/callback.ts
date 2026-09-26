import { createFileRoute } from "@tanstack/react-router";

function back(origin: string, status: string) {
  return Response.redirect(`${origin}/reseaux?meta=${encodeURIComponent(status)}`, 302);
}

export const Route = createFileRoute("/api/public/meta/callback")({
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
          const { completeConnection, getMetaConfig, CALLBACK_PATH } = await import(
            "@/lib/meta.server"
          );
          if (!getMetaConfig().ready) return back(origin, "demo");
          const count = await completeConnection(
            supabaseAdmin,
            row.user_id,
            code,
            `${origin}${CALLBACK_PATH}`,
          );
          return back(origin, count > 0 ? "connected" : "no_pages");
        } catch (error) {
          console.error("[meta] callback", error);
          return back(origin, "error");
        }
      },
    },
  },
});
