"use client";

import { useLocaleStore } from "@/store/locale";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hydrated = useLocaleStore((s) => s.hydrated);

  const pick = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-0.5",
        className,
      )}
    >
      {(["id", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => pick(code)}
          aria-pressed={hydrated ? locale === code : code === "id"}
          className={cn(
            "rounded-lg px-2 py-1 text-[11px] font-semibold tracking-wide transition",
            hydrated && locale === code
              ? "bg-white text-[var(--foreground)] shadow-sm dark:bg-[var(--card)]"
              : "text-muted hover:text-[var(--foreground)]",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
