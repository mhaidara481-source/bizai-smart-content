import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte BizAI" },
      {
        name: "description",
        content: "Crée ton compte BizAI et génère ton contenu marketing en quelques secondes.",
      },
      { property: "og:title", content: "Créer un compte BizAI" },
      { property: "og:description", content: "Rejoins BizAI et lance ta communication." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, business_name: businessName },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      navigate({ to: "/dashboard" });
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <AuthCard
        title="Vérifie ta boîte mail"
        subtitle={`Nous avons envoyé un lien de confirmation à ${email}. Clique dessus pour activer ton compte.`}
      >
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link to="/connexion">Aller à la connexion</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Créer ton compte"
      subtitle="Quelques secondes suffisent pour commencer."
      footer={
        <>
          Tu as déjà un compte ?{" "}
          <Link to="/connexion" className="font-semibold text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Ton nom</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Camille Dupont"
            autoComplete="name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessName">Nom de ton entreprise</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            placeholder="Salon Camille"
            autoComplete="organization"
            required
          />
        </div>
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
            placeholder="Au moins 6 caractères"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={loading}>
          {loading ? "Création…" : "Commencer gratuitement"}
        </Button>
      </form>
    </AuthCard>
  );
}
