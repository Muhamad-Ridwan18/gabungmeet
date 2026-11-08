"use client";

import Link from "next/link";
import { AppLogo } from "@/components/layout/AppLogo";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  return (
    <div className="app-shell relative flex min-h-screen bg-[var(--background)]">
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-[var(--border)] bg-[var(--card)] p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(0,82,255,0.16),transparent_55%)]" />
        <div className="relative">
          <AppLogo />
        </div>
        <div className="relative">
          <p className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{t("common.appName")}</p>
          <p className="mt-4 max-w-sm text-lg font-medium leading-snug tracking-tight">{t("landing.tagline")}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("landing.authAsideBody")}</p>
        </div>
        <p className="relative text-xs text-muted">
          <Link href={ROUTES.home} className="hover:text-accent">
            {t("landing.backHome")}
          </Link>
        </p>
      </aside>

      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(0,82,255,0.06),transparent_50%)]" />
        <div className="relative w-full max-w-lg animate-rise">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <AppLogo />
            <Link href={ROUTES.home} className="text-sm text-muted hover:text-accent">
              {t("landing.home")}
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
