import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Generated, VisualResult } from "./ai-types";

const visualSchema = z.object({
  businessType: z.string().min(1),
  subject: z.string().min(3).max(500),
  style: z.string().min(1),
  format: z.string().min(1),
});

export const generateVisualImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => visualSchema.parse(input))
  .handler(async ({ data, context }): Promise<Generated<VisualResult>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertQuota, recordGeneration } = await import("./ai.server");
    const { generateVisual } = await import("./visual.server");

    const quota = await assertQuota(supabaseAdmin, context.userId);
    const { data: result, demo } = await generateVisual(supabaseAdmin, context.userId, data);
    const remaining = await recordGeneration(
      supabaseAdmin,
      context.userId,
      quota,
      "visual" as never,
      data,
      result,
      demo,
    );
    return { data: result, demo, remaining };
  });

export type VisualHistoryItem = {
  id: string;
  url: string;
  subject: string;
  createdAt: string;
  demo: boolean;
};

export const listMyVisuals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VisualHistoryItem[]> => {
    const { data: rows, error } = await context.supabase
      .from("generations")
      .select("id, input, output, demo, created_at")
      .eq("user_id", context.userId)
      .eq("tool", "visual")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error("Impossible de charger tes visuels.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const items: VisualHistoryItem[] = [];
    for (const row of rows ?? []) {
      const output = (row.output ?? {}) as { url?: string; path?: string };
      const input = (row.input ?? {}) as { subject?: string };
      let url = output.url ?? "";
      // Ne signer que les fichiers appartenant à l'utilisateur.
      if (output.path && output.path.startsWith(`${context.userId}/`)) {
        const { data: signed } = await supabaseAdmin.storage
          .from("visuals")
          .createSignedUrl(output.path, 60 * 60 * 24);
        if (signed?.signedUrl) url = signed.signedUrl;
      }
      if (!url) continue;
      items.push({
        id: row.id,
        url,
        subject: input.subject ?? "Visuel",
        createdAt: row.created_at,
        demo: row.demo,
      });
    }
    return items;
  });
