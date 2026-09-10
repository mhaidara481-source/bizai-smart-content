import { SiteHeader } from "./SiteHeader";
import { LegalLinks } from "./LegalLinks";
import { ReactNode, isValidElement, cloneElement, Children } from "react";

type ElementProps = {
  className?: string;
  children?: ReactNode;
};

const contentStyles: Record<string, string> = {
  section: "space-y-3",
  h2: "text-lg font-bold tracking-tight text-foreground sm:text-xl",
  p: "leading-relaxed text-foreground/90",
  ul: "list-disc space-y-2 pl-5 text-foreground/90",
  li: "leading-relaxed",
  a: "text-primary underline underline-offset-2 transition-colors hover:text-primary/80",
};

function StyledContent({ children }: { children: ReactNode }) {
  function styleNode(node: ReactNode): ReactNode {
    if (!isValidElement(node)) return node;

    const typeName =
      typeof node.type === "function" ? node.type.name : String(node.type);
    const className = contentStyles[typeName] ?? "";

    const props = node.props as ElementProps;
    const existing = props.className ?? "";
    const merged = [className, existing].filter(Boolean).join(" ").trim();

    const styledChildren = Children.map(props.children, styleNode);

    const element = node as React.ReactElement<ElementProps>;

    return cloneElement(
      element,
      merged ? { className: merged } : {},
      styledChildren ?? props.children,
    );
  }

  return (
    <div className="space-y-10">
      {Children.map(children, styleNode)}
    </div>
  );
}

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
        <StyledContent>{children}</StyledContent>
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
