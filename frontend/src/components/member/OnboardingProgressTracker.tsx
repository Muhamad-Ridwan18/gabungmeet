"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { OnboardingProgress } from "@/services/onboarding";
import { ONBOARDING_STEP_KEYS } from "@/components/onboarding/StepRail";
import { ROUTES } from "@/constants";
import { membershipCta, isBrowseOnly } from "@/lib/membership";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

function stepDone(progress: OnboardingProgress, n: number) {
  return Boolean(
    (n === 1 && progress.step1_done_at) ||
      (n === 2 && progress.step2_done_at) ||
      (n === 3 && progress.step3_done_at) ||
      (n === 4 && progress.step4_done_at) ||
      (n === 5 && progress.step5_done_at),
  );
}

const NEXT_ACTION_KEYS = [
  "onboarding.step1Title",
  "onboarding.step2Title",
  "onboarding.step3Title",
  "onboarding.step4Title",
  "onboarding.step5Title",
] as const;

const UNLOCK_KEYS = [
  "member.psychology",
  "member.moneyManagement",
  "member.technical",
  "nav.signals",
  "member.compounding",
  "member.calendar",
  "member.tools",
] as const;

type Props = {
  progress: OnboardingProgress | null;
  status?: string;
  pending?: boolean;
};

export function OnboardingProgressTracker({ progress, status, pending }: Props) {
  const { t } = useT();
  const cta = membershipCta(status);
  const browseOnly = isBrowseOnly(status) && !progress;
  const current = progress?.current_step ?? 1;
  const completed = progress ? ONBOARDING_STEP_KEYS.filter((_, i) => stepDone(progress, i + 1)).length : 0;
  const pct = browseOnly ? 0 : Math.round((completed / 5) * 100);

  const nextActionKey =
    pending || browseOnly
      ? null
      : NEXT_ACTION_KEYS[Math.min(Math.max(current, 1), 5) - 1];

  if (browseOnly) {
    return (
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="section-kicker">{t("member.verificationPath")}</p>
        <h2 className="font-display mt-1 text-lg font-semibold tracking-tight">{t("onboarding.becomeTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("member.freeWhileVerifying")}</p>
        <Link href={cta.href} className="btn-primary mt-4 inline-flex gap-2">
          {t(cta.labelKey)}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">{t("member.verificationPath")}</p>
            <h2 className="font-display mt-1 text-lg font-semibold tracking-tight">
              {pending
                ? t("member.pendingReview")
                : t("member.stepOf", { n: current, total: 5 })}
            </h2>
          </div>
          <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {completed}/5
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div>
          <ol className="grid gap-2 sm:grid-cols-5">
            {ONBOARDING_STEP_KEYS.map((key, i) => {
              const n = i + 1;
              const done = progress ? stepDone(progress, n) : false;
              const active = !pending && current === n;
              return (
                <li
                  key={key}
                  className={cn(
                    "rounded-xl border px-3 py-3 text-center transition",
                    active && "border-accent/40 bg-accent-soft",
                    done && !active && "border-accent/20 bg-[var(--surface-2)]/60",
                    !done && !active && "border-[var(--border)]",
                  )}
                >
                  <span
                    className={cn(
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      done && "bg-accent text-[var(--btn-fg)]",
                      active && !done && "border border-accent text-accent",
                      !done && !active && "border border-[var(--border)] text-muted",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : n}
                  </span>
                  <p className="mt-2 text-[10px] font-medium leading-snug sm:text-[11px]">{t(key)}</p>
                </li>
              );
            })}
          </ol>

          {nextActionKey ? (
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {t("member.nextStep")}
              </p>
              <p className="mt-1 text-sm font-medium">{t(nextActionKey)}</p>
              <Link href={cta.href} className="btn-primary mt-3 inline-flex gap-2">
                {t(cta.labelKey)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : pending ? (
            <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
              <p className="text-sm text-muted">{t("member.welcomePending")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={ROUTES.onboarding} className="btn-ghost inline-flex">
                  {t("membership.viewVerification")}
                </Link>
                <Link
                  href={`${ROUTES.support}?topic=${encodeURIComponent(t("member.verificationHelpTopic"))}`}
                  className="btn-ghost inline-flex"
                >
                  {t("member.contactSupport")}
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
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
    </section>
  );
}
