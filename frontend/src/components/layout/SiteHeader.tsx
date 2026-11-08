"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { Sheet } from "@/components/ui/Sheet";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/useT";

const navLinks = [
  { href: ROUTES.home, key: "nav.home" },
  { href: ROUTES.about, key: "nav.about" },
] as const;

export function SiteHeader() {
  const { t } = useT();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (href: string) =>
    [
      "rounded-lg px-3 py-2 text-[13px] transition",
      pathname === href
        ? "bg-accent-soft font-medium text-accent"
        : "text-muted hover:bg-accent-soft hover:text-[var(--foreground)]",
    ].join(" ");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl dark:bg-[rgba(7,11,20,0.82)]">
        <div className="container-fluid flex h-[4.25rem] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-muted hover:bg-accent-soft md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t("common.menu")}
            >
              <Menu className="h-5 w-5" />
            </button>
            <AppLogo />
          </div>
          <nav className="hidden items-center gap-0.5 text-sm md:flex">
            {navLinks.map((l) => (
              <Link key={l.key} href={l.href} className={linkClass(l.href)}>
                {t(l.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
            <Link
              href={ROUTES.login}
              className="btn-ghost px-3 py-2 text-sm"
              onClick={() => track("cta_click", { source: "header_login" })}
            >
              {t("nav.login")}
            </Link>
            <Link
              href={ROUTES.register}
              className="btn-primary px-4 py-2"
              onClick={() => track("cta_click", { source: "header_register" })}
            >
              {t("nav.register")}
            </Link>
          </div>
        </div>
      </header>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title={t("common.menu")}
        widthClassName="w-[min(18rem,88vw)]"
      >
        <nav className="space-y-1 p-3">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-xl px-3 py-2.5 text-sm ${pathname === l.href ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-accent-soft"}`}
            >
              {t(l.key)}
            </Link>
          ))}
          <Link
            href={ROUTES.login}
            onClick={() => setMobileOpen(false)}
            className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-accent-soft"
          >
            {t("nav.login")}
          </Link>
          <Link
            href={ROUTES.register}
            onClick={() => {
              setMobileOpen(false);
              track("cta_click", { source: "header_register_mobile" });
            }}
            className="btn-primary mt-2 flex w-full justify-center px-3 py-2.5"
          >
            {t("nav.register")}
          </Link>
        </nav>
      </Sheet>
    </>
  );
}
