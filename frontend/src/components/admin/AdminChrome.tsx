import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] px-4 py-5 md:px-6 lg:px-8",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminFilterSeg({
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

export function AdminSplit({
  list,
  detail,
  className,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.85fr)]",
        className,
      )}
    >
      <div className="min-h-0 border-b border-[var(--border)] lg:border-b-0 lg:border-r">{list}</div>
      <aside className="flex min-h-[22rem] flex-col bg-[var(--card)] lg:min-h-0">{detail}</aside>
    </div>
  );
}

export function AdminEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function AdminBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3rem)] flex-col md:-mx-6 lg:-mx-8">{children}</div>
  );
}

export function formatRelativeTime(
  iso?: string | null,
  labels?: {
    justNow: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
    daysAgo: (n: number) => string;
  },
) {
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return labels?.justNow ?? "just now";
  if (m < 60) return labels?.minutesAgo(m) ?? `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return labels?.hoursAgo(h) ?? `${h}h ago`;
  const d = Math.floor(h / 24);
  return labels?.daysAgo(d) ?? `${d}d ago`;
}

export function AdminListRow({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full gap-1 px-4 py-3.5 text-left transition md:items-center md:gap-3 md:px-6",
        active ? "bg-accent-soft" : "hover:bg-[var(--surface-2)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
