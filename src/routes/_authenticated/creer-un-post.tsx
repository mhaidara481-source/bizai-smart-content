import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, Pencil, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { DemoBadge, LimitReached } from "@/components/app/LimitReached";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generatePost } from "@/lib/ai.functions";
import {
  BUSINESS_TYPES,
  LANGUAGES,
  LIMIT_REACHED_MESSAGE,
  PLATFORMS,
  TONES,
  type PostResult,
} from "@/lib/ai-types";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated/creer-un-post")({
  head: () => ({
    meta: [
      { title: "Créer un post — BizAI" },
      {
        name: "description",
        content: "Génère une publication prête à publier pour Instagram, Facebook, TikTok ou LinkedIn.",
      },
      { property: "og:title", content: "Créer un post — BizAI" },
      { property: "og:description", content: "Des publications prêtes à publier en quelques secondes." },
    ],
  }),
  component: CreatePost;
});

function CreatePost() {
  return null;
}
