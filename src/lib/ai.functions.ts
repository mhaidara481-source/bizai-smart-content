import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  CalendarResult,
  Generated,
  IdeasResult,
  PostResult,
  ReviewResult,
} from "./ai-types";

const postSchema = z.object({
  businessType: z.string().min(1),
  platform: z.string().min(1),
  topic: z.string().min(3).max(500),
  tone: z.string().min(1),
  language: z.string().min(1),
});

const reviewSchema = z.object({
  businessType: z.string().min(1),
  review: z.string().min(5).max(3000),
  tone: z.string().min(1),
  language: z.string().min(1),
});

const ideasSchema = z.object({
  businessType: z.string().min(1),
  platform: z.string().min(1),
  count: z.union([z.literal(10), z.literal(20), z.literal(30)]),
  language: z.string().min(1),
});

const calendarSchema = z.object({
  businessType: z.string().min(1),
  language: z.string().min(1),
});

export const generatePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => postSchema.parse(input))
  .handler(async ({ data, context }): Promise<Generated<PostResult>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertQuota, recordGeneration, generateContent } = await import("./ai.server");
    const quota = await assertQuota(supabaseAdmin, context.userId);
    const { data: result, demo } = await generateContent({ tool: "post", ...data });
    const remaining = await recordGeneration(
      supabaseAdmin,
      context.userId,
      quota,
      "post",
      data,
      result,
      demo,
    );
    return { data: result as PostResult, demo, remaining };
  });

export const generateReviewReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reviewSchema.parse(input))
  .handler(async ({ data, context }): Promise<Generated<ReviewResult>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertQuota, recordGeneration, generateContent } = await import("./ai.server");
    const quota = await assertQuota(supabaseAdmin, context.userId);
    const { data: result, demo } = await generateContent({ tool: "review", ...data });
    const remaining = await recordGeneration(
      supabaseAdmin,
      context.userId,
      quota,
      "review",
      data,
      result,
      demo,
    );
    return { data: result as ReviewResult, demo, remaining };
  });

export const generateIdeas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ideasSchema.parse(input))
  .handler(async ({ data, context }): Promise<Generated<IdeasResult>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertQuota, recordGeneration, generateContent } = await import("./ai.server");
    const quota = await assertQuota(supabaseAdmin, context.userId);
    const { data: result, demo } = await generateContent({ tool: "ideas", ...data });
    const remaining = await recordGeneration(
      supabaseAdmin,
      context.userId,
      quota,
      "ideas",
      data,
      result,
      demo,
    );
    return { data: result as IdeasResult, demo, remaining };
  });

export const generateCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => calendarSchema.parse(input))
  .handler(async ({ data, context }): Promise<Generated<CalendarResult>> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { assertQuota, recordGeneration, generateContent } = await import("./ai.server");
    const quota = await assertQuota(supabaseAdmin, context.userId);
    const startDate = new Date().toISOString().slice(0, 10);
    const { data: result, demo } = await generateContent({
      tool: "calendar",
      ...data,
      startDate,
    });
    const entries = ((result as CalendarResult).entries ?? []).slice(0, 30);

    // Remplace le calendrier existant à partir d'aujourd'hui.
    await supabaseAdmin
      .from("content_calendar")
      .delete()
      .eq("user_id", context.userId)
      .gte("entry_date", startDate);

    if (entries.length > 0) {
      await supabaseAdmin.from("content_calendar").insert(
        entries.map((entry) => ({
          user_id: context.userId,
          entry_date: entry.entry_date,
          platform: entry.platform,
          idea: entry.idea,
          format: entry.format,
        })),
      );
    }

    const remaining = await recordGeneration(
      supabaseAdmin,
      context.userId,
      quota,
      "calendar",
      data,
      { count: entries.length },
      demo,
    );
    return { data: { entries }, demo, remaining };
  });
