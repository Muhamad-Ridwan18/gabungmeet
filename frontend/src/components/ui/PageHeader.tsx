import { cn } from "@/lib/utils";

type PageHeaderProps = {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ kicker, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1 className={cn("font-display text-2xl font-semibold tracking-tight md:text-[1.75rem]", kicker && "mt-1.5")}>
          {title}
        </h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
