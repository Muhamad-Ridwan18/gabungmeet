import { EXTERNAL_LINKS, ROUTES } from "@/constants";

export type MemberNavItem = {
  href: string;
  labelKey: string;
  exact?: boolean;
  /** Locked until MT5 verification is approved. */
  locked?: boolean;
  /** Open in a new tab (external URL). */
  external?: boolean;
};

export const memberNav: MemberNavItem[] = [
  { href: ROUTES.member, labelKey: "nav.home", exact: true },
  { href: ROUTES.verification, labelKey: "member.verification" },
  { href: ROUTES.tutorial, labelKey: "member.tutorial" },
  { href: ROUTES.psychology, labelKey: "member.psychology", locked: true },
  { href: ROUTES.moneyManagement, labelKey: "member.moneyManagement", locked: true },
  { href: ROUTES.analysis, labelKey: "member.technical", locked: true },
  { href: ROUTES.signals, labelKey: "nav.signals", locked: true },
  { href: ROUTES.compounding, labelKey: "member.compounding", locked: true },
  {
    href: EXTERNAL_LINKS.forexFactoryCalendar,
    labelKey: "member.calendar",
    locked: true,
    external: true,
  },
  { href: ROUTES.tools, labelKey: "member.tools", locked: true },
];
