"use client";

import { termsAndConditions } from "@/content/terms-and-conditions";
import { useT } from "@/i18n/useT";

type TermsContentProps = {
  compact?: boolean;
};

export function TermsContent({ compact = false }: TermsContentProps) {
  const { locale } = useT();
  const c = termsAndConditions[locale === "id" ? "id" : "en"];

  return (
    <article className={compact ? "space-y-5" : "space-y-8"}>
      <header>
        <p className="section-kicker">{c.brandSubtitle}</p>
        <h1 className={compact ? "mt-2 font-display text-2xl font-semibold" : "section-title mt-2"}>{c.pageTitle}</h1>
        <h2 className="mt-4 text-sm font-semibold md:text-base">{c.introTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{c.intro}</p>
      </header>

      {c.sections.map((section) => (
        <section key={section.title} className={compact ? "space-y-2" : "space-y-3"}>
          <h3 className="font-display text-base font-semibold md:text-lg">{section.title}</h3>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="text-sm leading-relaxed text-muted md:text-base">
              {p}
            </p>
          ))}
          {section.bullets ? (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted md:text-base">
              {section.bullets.map((item) => (
                <li key={item.slice(0, 32)}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-display text-base font-semibold">
          {locale === "id" ? "7. Pernyataan Persetujuan" : "7. Consent Declaration"}
        </h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          {c.declarations.map((item) => (
            <li key={item.slice(0, 32)}>{item}</li>
          ))}
        </ol>
      </section>

      <p className="text-xs leading-relaxed text-muted md:text-sm">{c.legalNotice}</p>
    </article>
  );
}
