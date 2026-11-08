import { cn } from "@/lib/utils";

export function MemberFilterSeg({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition sm:text-sm",
            value === opt.value
              ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--card)]"
              : "text-muted hover:text-[var(--foreground)]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MemberList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]", className)}>
      {children}
    </div>
  );
}

export function MemberListRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const classes = cn(
    "w-full border-b border-[var(--border)] px-4 py-4 text-left last:border-b-0 sm:px-5",
    onClick && "transition hover:bg-[var(--surface-2)]",
    className,
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
      </button>
    );
  }
  return <div className={classes}>{children}</div>;
}

export function MemberPanel({
  title,
  children,
  actions,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6", className)}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="font-display text-base font-semibold tracking-tight sm:text-lg">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
