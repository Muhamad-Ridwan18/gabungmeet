import Link from "next/link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[var(--card)] px-6 py-10",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-accent">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <button type="button" className="btn-primary mt-5" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
