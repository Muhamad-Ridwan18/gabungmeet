"use client";

import { LockedModule } from "@/components/member/LockedModule";
import { ModuleBrowse } from "@/components/member/ModuleBrowse";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function AnalysisPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  if (!isVerifiedMember(user)) return <LockedModule title={t("member.technical")} />;
  return <ModuleBrowse module="daily_analysis" hrefBase="/member/analysis" />;
}
