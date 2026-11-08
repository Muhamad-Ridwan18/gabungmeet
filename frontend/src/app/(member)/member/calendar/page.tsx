"use client";

import { useEffect } from "react";
import { LockedModule } from "@/components/member/LockedModule";
import { EXTERNAL_LINKS } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MemberCalendarPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);

  useEffect(() => {
    if (!unlocked) return;
    window.location.replace(EXTERNAL_LINKS.forexFactoryCalendar);
  }, [unlocked]);

  if (!unlocked) return <LockedModule title={t("member.calendar")} />;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <p className="text-sm text-muted">{t("member.calendarRedirecting")}</p>
    </div>
  );
}
