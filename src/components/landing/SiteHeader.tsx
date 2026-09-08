import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const sections = [
  { href: "#produit", label: "Produit" },
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

export function BizAILogo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-hero">
        <Sparkles className="size-4 text-primary-foreground" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">BizAI</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <BizAILogo />

        <nav className="hidden items-center gap-7 md:flex">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Mon espace</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/connexion">Connexion</Link>
              </Button>
              <Button asChild>
                <Link to="/inscription">Commencer gratuitement</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-sm">
            <div className="mt-8 flex flex-col gap-1">
              {sections.map((section) => (
                <a
                  key={section.href}
                  href={section.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {section.label}
                </a>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {user ? (
                <Button asChild onClick={() => setOpen(false)}>
                  <Link to="/dashboard">Mon espace</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link to="/connexion">Connexion</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link to="/inscription">Commencer gratuitement</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
