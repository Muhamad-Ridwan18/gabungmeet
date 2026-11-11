"use client";

import Link from "next/link";
import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/theme";

const LIGHT_LOGO = "/logo-gabungmeet.jpeg";
const DARK_LOGO = "/logo-gabungmeet-dark.jpeg";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
};

export function AppLogo({ href = ROUTES.home, compact, className, markClassName }: AppLogoProps) {
  const theme = useThemeStore((state) => state.theme);

  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={theme === "dark" ? DARK_LOGO : LIGHT_LOGO}
        alt={APP_NAME}
        className={cn(
          compact ? "h-9 w-12" : "h-10 w-14 md:h-12 md:w-16",
          "rounded object-cover",
          markClassName,
        )}
      />
    </Link>
  );
}
