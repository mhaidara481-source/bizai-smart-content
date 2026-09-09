import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PLAN_LIMITS } from "@/hooks/useProfile";

function periodStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export type Subscription = {
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
};

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_start, current_period_end")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
  });
}

export function useUsage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["usage", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("usage")
        .select("generations_used")
        .eq("user_id", user!.id)
        .eq("period_start", periodStart())
        .maybeSingle();
      if (error) throw error;
      return data?.generations_used ?? 0;
    },
  });
}

export type GenerationRow = {
  id: string;
  tool: string;
  created_at: string;
  demo: boolean;
  input: unknown;
};

export const TOOL_LABELS: Record<string, string> = {
  post: "Post généré",
  review: "Réponse à un avis",
  ideas: "Idées de contenu",
  calendar: "Calendrier marketing",
};

export function useRecentGenerations(limit = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["generations", user?.id, limit],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<GenerationRow[]> => {
      const { data, error } = await supabase
        .from("generations")
        .select("id, tool, created_at, demo, input")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as GenerationRow[];
    },
  });
}

export function planLimit(plan: string | undefined) {
  return PLAN_LIMITS[plan ?? "free"] ?? PLAN_LIMITS["free"]!;
}
