import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getVideoQuotaFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getVideoQuota } = await import("./video.server");
    return getVideoQuota(supabaseAdmin, context.userId);
  });

export const startVideoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ businessType: z.string().min(1).max(60), subject: z.string().min(3).max(500), format: z.enum(["vertical", "horizontal"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { startVideo } = await import("./video.server");
    return startVideo(supabaseAdmin, context.userId, data);
  });

export const checkVideoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkVideo } = await import("./video.server");
    return checkVideo(supabaseAdmin, context.userId, data.jobId);
  });

export const listVideosFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listVideos } = await import("./video.server");
    return listVideos(supabaseAdmin, context.userId);
  });
