import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — BizAI" },
      { name: "description", content: "Réinitialise ton mot de passe BizAI." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setLoading(false);

    if (error) {
      toast.error(getAuthErrorMessage(error));
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard
        title="Email envoyé"
        subtitle="Vérifie ta boîte mail. Un lien de réinitialisation a été envoyé à ${email}."
      >
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link to="/connexion">Retour à la connexion</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Mot de passe oublié ?"
      subtitle="Saisis ton email pour recevoir un lien de réinitialisation."
      footer={
        <>
          <Link to="/connexion" className="font-semibold text-primary hover:underline">
            Retour à la connexion
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
        <Button type="submit" className="w-full rounded-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Envoyer le lien"
          )}
        </Button>
      </form>
    </AuthCard>
  );
}
