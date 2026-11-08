"use client";

import { MemberShell } from "@/components/layout/MemberShell";
import { AuthGate } from "@/components/common/AuthGate";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <MemberShell>{children}</MemberShell>
    </AuthGate>
  );
}
