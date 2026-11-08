"use client";

import { LockedModule } from "@/components/member/LockedModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function MemberToolsPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);

  if (!unlocked) return <LockedModule title={t("member.tools")} />;

  return (
    <div className="space-y-6">
      <PageHeader kicker={t("member.toolsKicker")} title={t("member.tools")} description={t("member.toolsDesc")} />
    </div>
  );
}
