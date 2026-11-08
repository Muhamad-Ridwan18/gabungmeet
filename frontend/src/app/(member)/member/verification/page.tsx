"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { OnboardingProgressTracker } from "@/components/member/OnboardingProgressTracker";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOnboarding, type OnboardingProgress } from "@/services/onboarding";
import { useAuthStore } from "@/store/auth";
import { ROUTES, USER_STATUS } from "@/constants";
import { isVerifiedMember, membershipCta } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MemberVerificationPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const verified = isVerifiedMember(user);
  const pending = user?.status === USER_STATUS.pending_verification;
  const cta = membershipCta(user?.status);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (verified) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const res = await getOnboarding();
        if (alive && res.success && res.data) setProgress(res.data);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [verified]);

  if (verified) {
    return (
      <div className="space-y-6">
        <PageHeader
          kicker={t("member.verifiedMember")}
          title={t("member.verification")}
          description={t("member.verificationCompleteDesc")}
        />
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">{t("member.verificationApprovedTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("member.verificationApprovedBody")}</p>
              <Link href={ROUTES.member} className="btn-primary mt-4 inline-flex gap-2">
                {t("nav.home")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.verificationPath")}
        title={t("member.verification")}
        description={t("member.verificationPageDesc")}
        actions={
          <Link href={ROUTES.onboarding} className="btn-primary inline-flex gap-2 text-sm">
            {t(cta.labelKey)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {!loading ? <OnboardingProgressTracker progress={progress} status={user?.status} pending={pending} /> : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-muted">{t("member.verificationWizardHint")}</p>
        <Link href={ROUTES.onboarding} className="btn-primary mt-4 inline-flex gap-2">
          {t("onboarding.startVerification")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
