"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ROUTES } from "@/constants";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { Sheet } from "@/components/ui/Sheet";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

const links: { href: string; labelKey: string; exact?: boolean }[] = [
  { href: ROUTES.admin, labelKey: "nav.overview", exact: true },
  { href: "/admin/users", labelKey: "nav.users" },
  { href: "/admin/verifications", labelKey: "nav.verifications" },
  { href: "/admin/content", labelKey: "nav.content" },
  { href: "/admin/landing", labelKey: "nav.landing" },
  { href: "/admin/branding", labelKey: "nav.branding" },
  { href: "/admin/member-home", labelKey: "nav.memberHome" },
  { href: "/admin/onboarding", labelKey: "nav.onboardingVideos" },
  { href: "/admin/signals", labelKey: "nav.signals" },
  { href: "/admin/bonuses", labelKey: "nav.bonuses" },
  { href: "/admin/tickets", labelKey: "nav.tickets" },
];

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { t } = useT();
  return (
    <nav className="space-y-0.5 p-2">
      {links.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition",
              active
                ? "nav-pill-active font-medium"
                : "text-muted hover:bg-accent-soft hover:text-[var(--foreground)]",
            )}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
      <Link
        href={ROUTES.member}
        onClick={onNavigate}
        className="mt-4 block rounded-lg px-3 py-2 text-sm text-muted hover:bg-accent-soft"
      >
        {t("nav.memberPreview")}
      </Link>
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <AppLogo href={ROUTES.admin} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <AdminNav pathname={pathname} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-[var(--border)] bg-[var(--header)] px-4 backdrop-blur-xl">
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted hover:bg-accent-soft md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo href={ROUTES.admin} compact className="md:hidden" />
          <p className="hidden text-sm font-medium md:block">{t("admin.ops")}</p>
          <div className="ml-auto flex items-center gap-2">
            <p className="hidden text-xs text-muted sm:block">{user?.email}</p>
            <LocaleToggle />
            <ThemeToggle />
            <button
              type="button"
              className="text-xs text-muted hover:text-accent"
              onClick={() => {
                clearSession();
                window.location.href = ROUTES.login;
              }}
            >
              {t("common.signOut")}
            </button>
          </div>
        </header>

        <main className="w-full flex-1 animate-fade px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title={t("status.admin")}
        description={t("admin.ops")}
        widthClassName="w-[min(18rem,88vw)]"
      >
        <AdminNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </Sheet>
    </div>
  );
}
