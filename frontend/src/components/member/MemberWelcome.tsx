"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { ROUTES } from "@/constants";
import { NEW_MEMBER_FLAG, VERIFIED_WELCOME_FLAG } from "@/lib/auth-routing";
import { useT } from "@/i18n/useT";

export function NewMemberWelcome() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(NEW_MEMBER_FLAG) === "1") {
      setOpen(true);
      sessionStorage.removeItem(NEW_MEMBER_FLAG);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="rounded-2xl border border-accent/25 bg-accent-soft/30 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">{t("member.welcomeNewKicker")}</p>
          <h2 className="font-display mt-1 text-lg font-semibold">{t("member.welcomeNewTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("member.welcomeNewBody")}</p>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-muted hover:bg-white/50"
          onClick={() => setOpen(false)}
          aria-label={t("common.close")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={ROUTES.onboarding} className="btn-primary inline-flex gap-2">
          {t("membership.becomeMember")}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href={ROUTES.psychology} className="btn-ghost" onClick={() => setOpen(false)}>
          {t("member.browseFreeContent")}
        </Link>
      </div>
    </div>
  );
}

export function VerifiedWelcome() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(VERIFIED_WELCOME_FLAG) === "1") {
      setOpen(true);
      sessionStorage.removeItem(VERIFIED_WELCOME_FLAG);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <p className="section-kicker">{t("member.verifiedWelcomeKicker")}</p>
        <h2 className="font-display mt-1 text-xl font-semibold">{t("member.verifiedWelcomeTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("member.verifiedWelcomeBody")}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li>· {t("member.psychology")}</li>
          <li>· {t("member.unlockAnalysis")}</li>
          <li>· {t("member.unlockSignals")}</li>
          <li>· {t("member.unlockTelegram")}</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={ROUTES.psychology} className="btn-primary" onClick={() => setOpen(false)}>
            {t("member.psychology")}
          </Link>
          <Link href={ROUTES.signals} className="btn-ghost" onClick={() => setOpen(false)}>
            {t("member.viewSignals")}
          </Link>
        </div>
      </div>
    </div>
  );
}
