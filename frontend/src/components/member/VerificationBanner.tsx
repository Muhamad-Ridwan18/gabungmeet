"use client";

import Link from "next/link";
import { AlertCircle, Clock, Sparkles } from "lucide-react";
import { USER_STATUS } from "@/constants";
import { membershipCta } from "@/lib/membership";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export function VerificationBanner() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const status = user?.status;
  const cta = membershipCta(status);

  if (!user || status === USER_STATUS.verified || user.role === "admin" || user.role === "super_admin") {
    return null;
  }

  const pending = status === USER_STATUS.pending_verification;
  const rejected = status === USER_STATUS.rejected;
  const locked = status === USER_STATUS.locked;

  return (
    <div
      className={`border-b px-4 py-2.5 md:px-6 ${
        rejected
          ? "border-[var(--danger)]/25 bg-[var(--danger)]/5"
          : pending
            ? "border-amber-500/25 bg-amber-500/5"
            : locked
              ? "border-[var(--danger)]/25 bg-[var(--danger)]/5"
              : "border-accent/20 bg-accent-soft/40"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-sm">
          {pending ? (
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          ) : rejected || locked ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" />
          ) : (
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          )}
          <p className="text-muted">
            {pending
              ? t("member.pendingBanner")
              : rejected
                ? t("member.rejectedBanner")
                : locked
                  ? t("member.lockedBanner")
                  : t("member.verifyBanner")}
          </p>
        </div>
        <Link href={cta.href} className="btn-primary shrink-0 px-4 py-1.5 text-xs sm:text-sm">
          {t(cta.labelKey)}
        </Link>
      </div>
    </div>
  );
}
