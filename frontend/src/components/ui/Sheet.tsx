"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "left" | "right";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  side?: Side;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  widthClassName?: string;
};

export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  description,
  children,
  className,
  widthClassName,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-black/45 animate-overlay"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute top-0 flex h-full flex-col border-[var(--border)] bg-[var(--sidebar)] shadow-[var(--shadow)]",
          side === "right" ? "right-0 border-l animate-drawer-right" : "left-0 border-r animate-drawer-left",
          widthClassName || "w-full max-w-md sm:max-w-[400px]",
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              {title ? <p className="font-display text-base font-semibold">{title}</p> : null}
              {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-accent-soft hover:text-accent"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
