"use client";

import { APP_NAME, ROUTES } from "@/constants";
import Link from "next/link";
import { useT } from "@/i18n/useT";

export function SiteFooter() {
  const { t, locale } = useT();

  const labels =
    locale === "id"
      ? {
          menu: "Menu",
          info: "Informasi",
          newsletter: "Newsletter",
          about:
            "Hub trading terpercaya untuk belajar, bertumbuh, dan berkembang bersama trader Indonesia.",
          terms: "Syarat & Ketentuan",
          policy: "Kebijakan Privasi",
          newsletterBody: "Dapatkan update analisis dan informasi penting langsung ke email kamu.",
          placeholder: "Masukkan email kamu",
          subscribe: "Subscribe",
        }
      : {
          menu: "Menu",
          info: "Information",
          newsletter: "Newsletter",
          about: "A trusted trading hub to learn, grow, and improve together with the community.",
          terms: "Terms & Conditions",
          policy: "Privacy Policy",
          newsletterBody: "Get market updates and important desk information straight to your inbox.",
          placeholder: "Enter your email",
          subscribe: "Subscribe",
        };

  return (
    <footer className="border-t border-[var(--border)] py-14">
      <div className="container-fluid grid gap-10 lg:grid-cols-[1.15fr_0.7fr_0.7fr_0.9fr]">
        <div>
          <p className="font-display text-xl font-semibold">{APP_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{labels.about}</p>
          <div className="mt-5 flex gap-2">
            {["TG", "YT", "DC", "IG"].map((x) => (
              <span
                key={x}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[10px] font-semibold text-muted"
              >
                {x}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">{labels.menu}</p>
          <div className="mt-4 space-y-2.5 text-sm text-muted">
            <Link href={ROUTES.home} className="block hover:text-accent">
              {t("nav.home")}
            </Link>
            <Link href={ROUTES.about} className="block hover:text-accent">
              {t("nav.about")}
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">{labels.info}</p>
          <div className="mt-4 space-y-2.5 text-sm text-muted">
            <Link href={ROUTES.about} className="block hover:text-accent">
              {t("nav.about")}
            </Link>
            <Link href={ROUTES.terms} className="block hover:text-accent">
              {labels.terms}
            </Link>
            <span className="block">{labels.policy}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">{labels.newsletter}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted">{labels.newsletterBody}</p>
          <div className="mt-4 flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
            <input
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none"
              placeholder={labels.placeholder}
            />
            <button type="button" className="btn-primary px-4 py-2">
              {labels.subscribe}
            </button>
          </div>
        </div>
      </div>
      <div className="container-fluid mt-10 flex flex-col gap-2 border-t border-[var(--border)] pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {APP_NAME}</p>
        <p>{t("landing.footerBody")}</p>
      </div>
    </footer>
  );
}
