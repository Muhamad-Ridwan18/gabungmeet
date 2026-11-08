"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { membershipCta } from "@/lib/membership";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";
import { track } from "@/lib/analytics";

const UNLOCK_KEYS = [
  "member.psychology",
  "member.moneyManagement",
  "member.technical",
  "nav.signals",
  "member.compounding",
  "member.calendar",
  "member.tools",
] as const;

export function LockedModule({ title }: { title: string }) {
  const { t } = useT();
  const status = useAuthStore((s) => s.user?.status);
  const cta = membershipCta(status);
  const supportHref = `${ROUTES.support}?topic=${encodeURIComponent(t("member.verificationHelpTopic"))}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,var(--glow),transparent_55%)]" />
      <div className="relative grid gap-8 px-6 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="max-w-lg">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Lock className="h-4 w-4" />
          </span>
          <p className="section-kicker mt-5">{t("member.membersOnly")}</p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t("member.lockedModuleBody")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={cta.href}
              className="btn-primary inline-flex gap-2"
              onClick={() => track("unlock_cta_click", { source: "locked_module", title })}
            >
              {t(cta.labelKey)}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={supportHref} className="btn-ghost">
              {t("member.contactSupport")}
            </Link>
          </div>
        </div>
        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            {t("member.unlocksAfterVerify")}
          </p>
          <ul className="mt-3 space-y-2">
            {UNLOCK_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                {t(key)}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
