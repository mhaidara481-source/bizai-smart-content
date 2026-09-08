import type { ReactNode } from "react";

import { BizAILogo } from "@/components/landing/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-14">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-primary-soft blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="flex justify-center">
          <BizAILogo />
        </div>
        <Card className="mt-7 rounded-3xl border-border/70 shadow-lift">
          <CardContent className="p-7">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
            <div className="mt-7">{children}</div>
          </CardContent>
        </Card>
        {footer ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}
