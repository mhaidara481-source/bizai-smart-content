import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, ImageIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyVisuals } from "@/lib/visual.functions";

export function VisualHistory() {
  const fetchVisuals = useServerFn(listMyVisuals);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["visual-history"],
    queryFn: () => fetchVisuals(),
  });

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Mes visuels</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Retrouve et télécharge les visuels que tu as déjà générés.
      </p>
      <div className="mt-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive">Impossible de charger tes visuels.</p>
        )}
        {data && data.length === 0 && (
          <Card className="border-border/70">
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ImageIcon className="size-5 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Aucun visuel pour l'instant. Ton premier apparaîtra ici.
              </p>
            </CardContent>
          </Card>
        )}
        {data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {data.map((v) => (
              <div
                key={v.id}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card animate-fade-in-up"
              >
                <img
                  src={v.url}
                  alt={v.subject}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                      {v.demo ? " · Démo" : ""}
                    </p>
                  </div>
                  <a
                    href={v.url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Télécharger"
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
