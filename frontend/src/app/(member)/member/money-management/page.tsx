"use client";

import { LockedModule } from "@/components/member/LockedModule";
import { ModuleBrowse } from "@/components/member/ModuleBrowse";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MoneyManagementPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  if (!isVerifiedMember(user)) return <LockedModule title={t("member.moneyManagement")} />;
  return <ModuleBrowse module="money_management" hrefBase="/member/money-management" />;
}
