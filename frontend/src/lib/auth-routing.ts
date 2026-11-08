import { ROUTES, USER_STATUS } from "@/constants";
import type { User } from "@/types/auth";

export function postAuthRoute(user: User): string {
  if (user.role === "admin" || user.role === "super_admin") return ROUTES.admin;
  if (user.status === USER_STATUS.locked) return ROUTES.support;
  if (
    user.status === USER_STATUS.onboarding ||
    user.status === USER_STATUS.rejected ||
    user.status === USER_STATUS.pending_verification
  ) {
    return ROUTES.onboarding;
  }
  return ROUTES.member;
}

export const NEW_MEMBER_FLAG = "sp_new_member";
export const VERIFIED_WELCOME_FLAG = "sp_verified_welcome";
