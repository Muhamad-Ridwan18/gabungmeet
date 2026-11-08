"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { getOnboarding } from "@/services/onboarding";
import { getMemberHome, type MemberHomeContent } from "@/services/member-home";
import { isBrowseOnly, isVerifiedMember, membershipCta } from "@/lib/membership";
import { OnboardingProgressTracker } from "@/components/member/OnboardingProgressTracker";
import { MemberHomeSections } from "@/components/member/MemberHomeSections";
import { NewMemberWelcome, VerifiedWelcome } from "@/components/member/MemberWelcome";
import { Skeleton } from "@/components/ui/Skeleton";
import type { OnboardingProgress } from "@/services/onboarding";
import { useT } from "@/i18n/useT";
import { USER_STATUS } from "@/constants";
import Link from "next/link";
import { ROUTES } from "@/constants";

const emptyContent: MemberHomeContent = {
  welcome: null,
  tutorial: null,
  referral: null,
};

export default function MemberDashboardPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const verified = isVerifiedMember(user);
  const firstName = user?.profile?.full_name?.split(" ")[0] || t("status.member");
  const pending = user?.status === USER_STATUS.pending_verification;
  const cta = membershipCta(user?.status);

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<MemberHomeContent>(emptyContent);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [homeRes, obRes] = await Promise.all([
          getMemberHome(),
          !verified ? getOnboarding().catch(() => null) : Promise.resolve(null),
        ]);
        if (!alive) return;
        if (homeRes.success) setContent(homeRes.data ?? emptyContent);
        else setFetchError(homeRes.message || t("member.homeLoadFailed"));
        if (obRes?.success && obRes.data) setOnboarding(obRes.data);
      } catch {
        if (alive) setFetchError(t("member.homeLoadFailed"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, accessToken, verified, t]);

  const showFunnel = !verified;
  const hasConfiguredContent = Boolean(content.welcome || content.tutorial || content.referral);

  return (
    <div className="space-y-6">
      <NewMemberWelcome />
      <VerifiedWelcome />

      {showFunnel ? (
        <OnboardingProgressTracker progress={onboarding} status={user?.status} pending={pending} />
      ) : null}

      {fetchError ? (
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">
          {fetchError}
        </p>
      ) : null}

      {loading || !hydrated || !accessToken ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : fetchError ? null : hasConfiguredContent ? (
        <MemberHomeSections content={content} firstName={firstName} />
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <h2 className="font-display text-xl font-semibold">{t("member.homeEmptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">{t("member.homeEmptyBody")}</p>
          {!verified ? (
            <Link href={cta.href} className="btn-primary mt-5 inline-flex">
              {t(cta.labelKey)}
            </Link>
          ) : (
            <Link href={ROUTES.psychology} className="btn-primary mt-5 inline-flex">
              {t("member.exploreModules")}
            </Link>
          )}
        </section>
      )}

      {!verified && isBrowseOnly(user?.status) ? (
        <p className="text-center text-sm text-muted">{t("member.freeWhileVerifying")}</p>
      ) : null}
    </div>
  );
}
