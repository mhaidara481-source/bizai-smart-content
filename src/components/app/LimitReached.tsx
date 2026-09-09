import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LIMIT_REACHED_MESSAGE } from "@/lib/ai-types";

export function LimitReached({ message }: { message?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <p className="text-sm font-medium text-foreground">{message ?? LIMIT_REACHED_MESSAGE}</p>
      </div>
      <Button asChild className="rounded-full">
        <Link to="/abonnement">Voir les offres</Link>
      </Button>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
      Mode démo — connecte une clé API pour des résultats réels
    </span>
  );
}
