import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export { PLAN_LIMITS, PLAN_LABELS } from "@/lib/plans";

export type Profile = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  business_type: string | null;
  plan: string;
  generations_used: number;
};

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, business_name, business_type, plan, generations_used")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}
