export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 animate-fade-in-up">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
