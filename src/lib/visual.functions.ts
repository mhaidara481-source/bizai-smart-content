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
