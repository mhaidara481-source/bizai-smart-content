import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu } from "lucide-react";

import { navItems } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, PLAN_LABELS } from "@/hooks/useProfile";
import { BizAILogo } from "@/components/landing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AccountBlock() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/connexion", replace: true });
  }

  return (
    <div className="space-y-3">
      <Separator />
      <div className="px-1">
        <p className="truncate text-sm font-semibold">
          {profile?.business_name ?? profile?.full_name ?? "Mon entreprise"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        <p className="mt-1 text-xs font-medium text-primary">
          Plan {PLAN_LABELS[profile?.plan ?? "free"] ?? "Découverte"}
        </p>
      </div>
      <Button variant="outline" className="w-full rounded-xl" onClick={handleSignOut}>
        <LogOut className="size-4" />
        Se déconnecter
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const currentLabel = useRouterState({
    select: (state) =>
      navItems.find((item) => state.location.pathname.startsWith(item.to))?.label ?? "BizAI",
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
        <div>
          <div className="px-1">
            <BizAILogo />
          </div>
          <div className="mt-8">
            <NavLinks />
          </div>
        </div>
        <AccountBlock />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/90 px-5 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[80vw] max-w-xs flex-col justify-between bg-sidebar p-5">
            <div>
              <BizAILogo />
              <div className="mt-8">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
            </div>
            <AccountBlock />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">{currentLabel}</span>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
