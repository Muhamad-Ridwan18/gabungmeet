export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Santara Pips";

/**
 * API base URL.
 * Local/dev: same-origin `/v1` (Next.js rewrites → Laravel :8081) or explicit localhost URL.
 * Production: NEXT_PUBLIC_API_URL=https://api.santarapips.com/v1
 */
function resolveApiUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!raw) return "/v1";
  // Guard misconfig that points at the Next.js app itself
  if (/^https?:\/\/(localhost|127\.0\.0\.1):300\d/i.test(raw)) {
    return "/v1";
  }
  return raw;
}

export const API_URL = resolveApiUrl();

export const ROUTES = {
  home: "/",
  about: "/about",
  terms: "/terms",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  member: "/member",
  verification: "/member/verification",
  tutorial: "/member/tutorial",
  academy: "/member/academy",
  psychology: "/member/psychology",
  moneyManagement: "/member/money-management",
  analysis: "/member/analysis",
  signals: "/member/signals",
  compounding: "/member/compounding",
  calendar: "/member/calendar",
  tools: "/member/tools",
  journal: "/member/journal",
  bonus: "/member/bonus",
  profile: "/member/profile",
  support: "/member/support",
  admin: "/admin",
} as const;

/** External tools opened from the member desk. */
export const EXTERNAL_LINKS = {
  forexFactoryCalendar: "https://www.forexfactory.com/calendar",
} as const;

export const USER_STATUS = {
  registered: "registered",
  onboarding: "onboarding",
  pending_verification: "pending_verification",
  verified: "verified",
  rejected: "rejected",
  locked: "locked",
} as const;

export const ROLES = {
  member: "member",
  admin: "admin",
  super_admin: "super_admin",
} as const;
