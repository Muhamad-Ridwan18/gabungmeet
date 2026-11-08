"use client";

import Link from "next/link";
import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const STATIC_LOGO = "/logo-santara.png";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  nameClassName?: string;
};

export function AppLogo({ href = ROUTES.home, compact, className, markClassName, nameClassName }: AppLogoProps) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STATIC_LOGO}
        alt={APP_NAME}
        className={cn("h-9 w-auto object-contain md:h-10", markClassName)}
      />
      {!compact ? (
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tight transition group-hover:text-accent",
            nameClassName,
          )}
        >
          <span className="text-[var(--foreground)]">Santara </span>
          <span className="text-[#c5a059]">Pips</span>
        </span>
      ) : null}
    </Link>
  );
}
