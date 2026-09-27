export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-7 min-w-0 animate-fade-in-up sm:mb-9">
      <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
