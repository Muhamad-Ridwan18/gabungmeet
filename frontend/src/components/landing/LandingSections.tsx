"use client";

import type { LandingContent, LandingItem, LandingLocale, LandingSection } from "@/services/landing";
import { cn } from "@/lib/utils";

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

/** Body text written in the admin rich-text editor (sanitised by the API on save). */
function RichBody({ html, className }: { html: string; className?: string }) {
  if (!html.trim()) return null;
  const base = "mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base";
  if (!looksLikeHtml(html)) {
    return <p className={cn(base, "whitespace-pre-line", className)}>{html}</p>;
  }
  return <div className={cn("content-html", base, className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

function ImageCard({ item }: { item: LandingItem }) {
  const inner = (
    <>
      <div className="aspect-square w-full overflow-hidden bg-[var(--surface-2)]">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.title || ""}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>
      {item.title || item.body ? (
        <div className="p-4">
          {item.title ? <p className="font-display text-base font-semibold">{item.title}</p> : null}
          {item.body ? <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{item.body}</p> : null}
        </div>
      ) : null}
    </>
  );
  const cls = "group surface-panel block overflow-hidden";
  if (!item.link) return <article className={cls}>{inner}</article>;
  const external = /^https?:\/\//i.test(item.link);
  return (
    <a
      href={item.link}
      className={cn(cls, "transition hover:border-[var(--accent)]")}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}

function SectionBody({ section, locale }: { section: LandingSection; locale: LandingLocale }) {
  const l = section.i18n[locale] ?? section.i18n.id;
  const items = l.items ?? [];

  return (
    <>
      {l.kicker ? <p className="section-kicker">{l.kicker}</p> : null}
      {l.title ? <h2 className="section-title mt-2 max-w-3xl">{l.title}</h2> : null}
      <RichBody html={l.body} />

      {section.kind === "cards" && items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <article key={`${item.title}-${i}`} className="surface-panel p-5">
              <p className="font-display text-base font-semibold">{item.title}</p>
              {item.body ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{item.body}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {section.kind === "image_cards" && items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <ImageCard key={`${item.title}-${i}`} item={item} />
          ))}
        </div>
      ) : null}

      {section.kind === "steps" && items.length > 0 ? (
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li key={`${item.title}-${i}`} className="surface-panel p-5">
              <span className="font-display text-3xl font-semibold text-accent/20">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-display text-base font-semibold">{item.title}</p>
              {item.body ? <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{item.body}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {section.kind === "chips" && items.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={`${item.title}-${i}`}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium"
            >
              {item.title}
            </span>
          ))}
        </div>
      ) : null}

      {section.kind === "compare" && items.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="grid grid-cols-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold uppercase tracking-wide">
            <div className="border-r border-[var(--border)] px-4 py-3 text-accent">{l.col_a}</div>
            <div className="px-4 py-3 text-muted">{l.col_b}</div>
          </div>
          {items.map((row, i) => (
            <div
              key={`${row.title}-${i}`}
              className={cn("grid grid-cols-2 text-sm", i < items.length - 1 && "border-b border-[var(--border)]")}
            >
              <div className="border-r border-[var(--border)] bg-accent-soft/30 px-4 py-4 leading-relaxed text-[var(--foreground)]">
                {row.title}
              </div>
              <div className="px-4 py-4 leading-relaxed text-muted">{row.body}</div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function LandingSections({ content, locale }: { content: LandingContent; locale: LandingLocale }) {
  const sections = content.sections.filter((s) => s.enabled);
  const disclaimer = content.disclaimer[locale] ?? content.disclaimer.id;

  return (
    <div className="border-t border-[var(--border)]">
      {sections.map((section, i) =>
        i % 2 === 1 ? (
          <section key={section.key} className="border-y border-[var(--border)] bg-[var(--card)]">
            <div className="container-fluid py-12 md:py-14">
              <SectionBody section={section} locale={locale} />
            </div>
          </section>
        ) : (
          <section key={section.key} className="container-fluid py-12 md:py-14">
            <SectionBody section={section} locale={locale} />
          </section>
        ),
      )}

      {disclaimer.body ? (
        <section className="container-fluid pb-16 pt-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
            {disclaimer.label ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{disclaimer.label}</p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-muted md:text-sm">{disclaimer.body}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
