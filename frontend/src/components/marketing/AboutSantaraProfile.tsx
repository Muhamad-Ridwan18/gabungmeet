"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  LineChart,
  Shield,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { santaraProfile } from "@/content/santara-profile";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/useT";

export function AboutSantaraProfile() {
  const { t, locale } = useT();
  const c = santaraProfile[locale === "id" ? "id" : "en"];

  return (
    <div className="bg-[var(--background)]">
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_80%_0%,rgba(0,82,255,0.16),transparent_55%)]" />
        <div className="relative container-fluid py-12 md:py-16">
          <p className="section-kicker">{c.whatIs.kicker}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">{c.brandLine}</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-muted md:text-base">{c.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {c.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px] font-semibold text-accent"
              >
                {badge}
              </span>
            ))}
          </div>
          <h2 className="mt-8 max-w-3xl font-display text-2xl font-semibold md:text-3xl">{c.whatIs.title}</h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.whatIs.paragraphs.map((p) => (
              <p key={p.slice(0, 28)} className={p === c.whatIs.paragraphs[0] ? "text-base font-medium text-[var(--foreground)] md:text-lg" : ""}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <p className="section-kicker">{c.notJustEntry.kicker}</p>
          <h2 className="section-title mt-2 max-w-3xl">{c.notJustEntry.title}</h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.notJustEntry.paragraphs.map((p) => (
              <p key={p.slice(0, 28)}>{p}</p>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-accent/25 bg-accent-soft p-5 md:p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent md:text-base">{c.notJustEntry.principle}</p>
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-accent" />
          <p className="section-kicker">{c.technical.kicker}</p>
        </div>
        <h2 className="section-title mt-2">{c.technical.title}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.technical.items.map((item, i) => (
            <article key={item.title} className="surface-panel p-5">
              <span className="text-xs font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-display text-base font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <p className="section-kicker">{c.risk.kicker}</p>
          </div>
          <h2 className="section-title mt-2 max-w-3xl">{c.risk.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.risk.intro}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.risk.items.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 text-sm leading-relaxed text-muted italic md:text-base">
            {c.risk.philosophy}
          </p>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <p className="section-kicker">{c.independence.kicker}</p>
        </div>
        <h2 className="section-title mt-2 max-w-3xl">{c.independence.title}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {c.independence.steps.map((step) => (
            <li key={step.num} className="surface-panel p-5">
              <span className="font-display text-3xl font-semibold text-accent/20">{step.num}</span>
              <p className="mt-1 font-display text-base font-semibold">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.independence.goal}</p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <p className="section-kicker">{c.experience.kicker}</p>
          <h2 className="section-title mt-2">{c.experience.title}</h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.experience.paragraphs.map((p) => (
              <p key={p.slice(0, 28)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <p className="section-kicker">{c.community.kicker}</p>
        </div>
        <h2 className="section-title mt-2 max-w-3xl">{c.community.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.community.body}</p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-center font-mono text-xs font-medium tracking-wide text-accent md:text-sm">{c.community.flow}</p>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.community.closing}</p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent" />
            <p className="section-kicker">{c.ai.kicker}</p>
          </div>
          <h2 className="section-title mt-2">{c.ai.title}</h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.ai.paragraphs.map((p) => (
              <p key={p.slice(0, 28)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="section-kicker">{c.philosophy.kicker}</p>
        </div>
        <h2 className="section-title mt-2 max-w-3xl">{c.philosophy.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.philosophy.body}</p>
        <div className="mt-8 rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),transparent_65%)] p-6 md:p-8">
          <p className="font-display text-xl font-semibold tracking-tight text-accent md:text-2xl">{c.philosophy.credo}</p>
          {c.philosophy.credoId ? (
            <p className="mt-2 text-sm text-muted">({c.philosophy.credoId})</p>
          ) : null}
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.philosophy.closing}</p>
        </div>
        <p className="mt-8 text-center font-display text-lg font-semibold tracking-wide text-[var(--foreground)] md:text-xl">
          {c.motto}
        </p>
      </section>

      <section className="container-fluid pb-12 md:pb-16">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Disclaimer</p>
          <p className="mt-3 text-xs leading-relaxed text-muted md:text-sm">{c.disclaimer}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold">{t("about.ctaTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{t("about.ctaBody")}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href={ROUTES.register}
              className="btn-primary inline-flex gap-2"
              onClick={() => track("cta_click", { source: "about" })}
            >
              {t("nav.joinNow")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={ROUTES.home} className="btn-ghost">
              {t("landing.backHome")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
