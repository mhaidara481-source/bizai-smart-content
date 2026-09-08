import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — BizAI" },
      { name: "description", content: "Connecte-toi à ton espace BizAI." },
      { property: "og:title", content: "Connexion — BizAI" },
      { property: "og:description", content: "Accède à tes outils de contenu marketing." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      toast.error("Email ou mot de passe incorrect.");
      return;
    }

    navigate({ to: "/dashboard" });
  }

  return (
    <AuthCard
      title="Bon retour"
      subtitle="Connecte-toi pour retrouver tes outils."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/inscription" className="font-semibold text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="toi@exemple.fr"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </AuthCard>
  );
}
