import { SiteHeader } from "./SiteHeader";
import { LegalLinks } from "./LegalLinks";
import { ReactNode } from "react";

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-5 py-14 sm:py-20">
        <div className="mb-10 border-b border-border/70 pb-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {intro ? (
            <p className="mt-4 text-base text-muted-foreground">{intro}</p>
          ) : null}
        </div>
        <div className="prose prose-sm max-w-none text-foreground">
          {children}
        </div>
      </main>
      <footer className="border-t border-border/70 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} BizAI</span>
          <LegalLinks className="flex flex-wrap justify-center gap-4" />
        </div>
      </footer>
    </div>
  );
}
