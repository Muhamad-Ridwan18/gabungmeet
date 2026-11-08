"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

const tones: Record<string, string> = {
  accent: "bg-accent-soft text-accent border-accent/25",
  muted: "bg-[var(--surface-2)] text-muted border-[var(--border)]",
  danger: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/25",
  warn: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25",
  success: "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25",
};

type StatusBadgeProps = {
  label: string;
  tone?: keyof typeof tones;
  className?: string;
  /** When true, skip status dictionary lookup */
  raw?: boolean;
};

export function StatusBadge({ label, tone = "muted", className, raw }: StatusBadgeProps) {
  const { ts } = useT();
  const text = raw ? label.replaceAll("_", " ") : ts(label);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize tracking-wide",
        tones[tone],
        className,
      )}
    >
      {text}
    </span>
  );
}

export function statusTone(status: string): keyof typeof tones {
  const s = status.toLowerCase();
  if (["active", "verified", "published", "win", "solved", "open"].includes(s)) return "accent";
  if (["pending", "pending_verification", "in_progress", "onboarding"].includes(s)) return "warn";
  if (["rejected", "locked", "cancelled", "loss", "closed", "danger"].includes(s)) return "danger";
  return "muted";
}
