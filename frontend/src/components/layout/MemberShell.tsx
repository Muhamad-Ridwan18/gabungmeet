"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Lock, LogOut, Menu } from "lucide-react";
import { memberNav } from "@/config/member-nav";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { Sheet } from "@/components/ui/Sheet";
import { VerificationBanner } from "@/components/member/VerificationBanner";
import { listNotifications, type NotificationItem } from "@/services/notifications";
import { isVerifiedMember } from "@/lib/membership";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type MemberNavProps = {
  pathname: string;
  verified: boolean;
  onNavigate?: () => void;
};

function MemberNav({ pathname, verified, onNavigate }: MemberNavProps) {
  const { t } = useT();
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <>
      <nav className="space-y-0.5 p-2">
        {memberNav.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const locked = Boolean(item.locked) && !verified;
          const className = cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
            active && !locked
              ? "nav-pill-active font-medium"
              : "text-muted",
            locked ? "cursor-not-allowed opacity-55" : "hover:bg-accent-soft hover:text-[var(--foreground)]",
          );

          if (locked) {
            return (
              <span key={item.href + item.labelKey} className={className} aria-disabled="true">
                <span>{t(item.labelKey)}</span>
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </span>
            );
          }

          return item.external ? (
            <a
              key={item.href + item.labelKey}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
              className={className}
            >
              <span>{t(item.labelKey)}</span>
            </a>
          ) : (
            <Link key={item.href + item.labelKey} href={item.href} onClick={onNavigate} className={className}>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] p-2">
        {!verified ? (
          <Link
            href={ROUTES.verification}
            onClick={onNavigate}
            className="btn-primary mb-2 flex w-full justify-center px-3 py-2 text-xs"
          >
            {t("member.verification")}
          </Link>
        ) : null}
        <Link
          href={ROUTES.profile}
          onClick={onNavigate}
          className={cn(
            "block rounded-lg px-3 py-2 text-sm transition",
            pathname === ROUTES.profile
              ? "nav-pill-active font-medium"
              : "text-muted hover:bg-accent-soft hover:text-[var(--foreground)]",
          )}
        >
          {t("nav.myAccount")}
        </Link>
        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-accent-soft hover:text-[var(--foreground)]"
          onClick={() => {
            clearSession();
            window.location.href = ROUTES.login;
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("common.logout")}
        </button>
      </div>
    </>
  );
}

export function MemberShell({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const verified = isVerifiedMember(user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [openNotes, setOpenNotes] = useState(false);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenNotes(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await listNotifications();
        if (res.success && res.data) setNotes(res.data);
      } catch {
        /* ignore */
      }
    })();
  }, [user, pathname]);

  const initials =
    user?.profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SP";

  const unread = notes.filter((n) => !n.read_at).length;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <div className="border-b border-[var(--border)] px-4 py-4">
          <AppLogo href={ROUTES.member} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
          <MemberNav pathname={pathname} verified={verified} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
          <div className="flex h-12 items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted hover:bg-accent-soft md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <AppLogo href={ROUTES.member} compact className="md:hidden" />
            <p className="hidden text-sm font-medium md:block">{t("member.memberDesk")}</p>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {!verified ? (
                <Link href={ROUTES.verification} className="btn-primary hidden px-3 py-1.5 text-xs sm:inline-flex">
                  {t("member.verification")}
                </Link>
              ) : null}
              <div className="relative">
                <button
                  type="button"
                  className="relative rounded-xl p-2 text-muted transition hover:bg-accent-soft hover:text-accent"
                  onClick={() => setOpenNotes((v) => !v)}
                  aria-label={t("common.notifications")}
                >
                  <Bell className="h-4 w-4" />
                  {unread > 0 ? (
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </button>
                {openNotes ? (
                  <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-2 shadow-[var(--shadow)]">
                    {notes.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-muted">{t("common.noNotifications")}</p>
                    ) : (
                      notes.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || ROUTES.support}
                          className="block rounded-xl px-3 py-2.5 text-xs hover:bg-accent-soft"
                          onClick={() => setOpenNotes(false)}
                        >
                          <p className="font-medium">{n.title}</p>
                          <p className="mt-0.5 text-muted">{n.body}</p>
                        </Link>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <LocaleToggle />
              <ThemeToggle />
              <Link
                href={ROUTES.profile}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white shadow-sm"
                title={user?.email}
              >
                {initials}
              </Link>
            </div>
          </div>
          <VerificationBanner />
        </header>

        <main className="w-full flex-1 animate-fade px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title={t("member.memberDesk")}
        description={verified ? t("member.verifiedMember") : t("member.modulesLocked")}
        widthClassName="w-[min(18rem,88vw)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <MemberNav pathname={pathname} verified={verified} onNavigate={() => setMobileOpen(false)} />
        </div>
      </Sheet>
    </div>
  );
}
