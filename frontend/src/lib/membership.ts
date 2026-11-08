import { ROUTES, USER_STATUS } from "@/constants";
import type { User } from "@/types/auth";

/** Account created but has not started IB verification yet. */
export function isBrowseOnly(status?: string | null) {
  return !status || status === USER_STATUS.registered;
}

/** User already started (or finished submitting) IB verification. */
export function isVerificationActive(status?: string | null) {
  return (
    status === USER_STATUS.onboarding ||
    status === USER_STATUS.pending_verification ||
    status === USER_STATUS.rejected
  );
}

export function isVerifiedMember(user?: Pick<User, "status" | "role"> | null) {
  if (!user) return false;
  return user.status === USER_STATUS.verified || user.role === "admin" || user.role === "super_admin";
}

export type MembershipCtaKey =
  | "membership.becomeMember"
  | "membership.viewVerification"
  | "membership.resubmit"
  | "membership.continueVerification"
  | "membership.contactSupport";

export function membershipCta(status?: string | null): { labelKey: MembershipCtaKey; href: string } {
  if (status === USER_STATUS.locked) {
    return { labelKey: "membership.contactSupport", href: `${ROUTES.support}?topic=account` };
  }
  if (isBrowseOnly(status)) {
    return { labelKey: "membership.becomeMember", href: ROUTES.onboarding };
  }
  if (status === USER_STATUS.pending_verification) {
    return { labelKey: "membership.viewVerification", href: ROUTES.onboarding };
  }
  if (status === USER_STATUS.rejected) {
    return { labelKey: "membership.resubmit", href: ROUTES.onboarding };
  }
  return { labelKey: "membership.continueVerification", href: ROUTES.onboarding };
}
