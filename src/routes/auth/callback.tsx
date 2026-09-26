import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth/callback")({
  head: () => pageHead({ title: "Connexion en cours — BizAI", description: "Finalisation de ta connexion à BizAI.", path: "/auth/callback", noindex: true }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        console.error("Auth callback error:", error);
        navigate({ to: "/connexion" });
        return;
      }

      // Check if we have a type=recovery in the URL (password reset)
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (hash.includes("type=recovery") || searchParams.get("type") === "recovery") {
        navigate({ to: "/reinitialisation-mot-de-passe" });
        return;
      }

      navigate({ to: "/dashboard" });
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Finalisation de la connexion…</p>
      </div>
    </div>
  );
}
