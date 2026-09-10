import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { BUSINESS_TYPES } from "@/lib/ai-types";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — BizAI" },
      { name: "description", content: "Mets à jour ton profil et les infos de ton entreprise." },
      { property: "og:title", content: "Paramètres — BizAI" },
      { property: "og:description", content: "Ton profil et ton entreprise sur BizAI." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setBusinessName(profile.business_name ?? "");
    setBusinessType(profile.business_type ?? "Restaurant");
  }, [profile]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          business_name: businessName.trim() || null,
          business_type: businessType,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Paramètres enregistrés !");
    },
    onError: (error: Error) => toast.error(error.message || "L'enregistrement a échoué."),
  });

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Tes informations personnelles et ton entreprise." />

      <Card className="max-w-2xl rounded-2xl border-border/70 shadow-soft">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ton nom"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Nom de l'entreprise</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              placeholder="Ton entreprise"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Type d'activité</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-full"
            disabled={mutation.isPending || isLoading}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enregistrement…
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
