"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  GitCompare,
  Layers,
  ShieldAlert,
  Target,
} from "lucide-react";
import { xauusdEducation } from "@/content/xauusd-education";
import { useT } from "@/i18n/useT";

export function LandingXauusdEducation() {
  const { locale } = useT();
  const c = xauusdEducation[locale === "id" ? "id" : "en"];

  return (
    <div className="border-t border-[var(--border)] bg-[var(--background)]">
      <section className="container-fluid py-12 md:py-16">
        <p className="section-kicker">{c.kicker}</p>
        <h2 className="section-title mt-2 max-w-3xl">{c.title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.subtitle}</p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <p className="section-kicker">{c.intro.kicker}</p>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.intro.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <p className="section-kicker">{c.whatIs.kicker}</p>
        <h3 className="section-title mt-2 max-w-3xl">{c.whatIs.title}</h3>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
          {c.whatIs.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="surface-panel border-emerald-500/20 p-5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{c.whatIs.buyLabel}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{c.whatIs.buyText}</p>
          </article>
          <article className="surface-panel border-rose-500/20 p-5">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ArrowDownRight className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">{c.whatIs.sellLabel}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{c.whatIs.sellText}</p>
          </article>
        </div>
        <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold">{c.whatIs.noteLabel}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.whatIs.noteText}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-accent" />
            <p className="section-kicker">{c.compare.kicker}</p>
          </div>
          <h3 className="section-title mt-2">{c.compare.title}</h3>
          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="grid grid-cols-2 border-b border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold uppercase tracking-wide">
              <div className="border-r border-[var(--border)] px-4 py-3 text-accent">{c.compare.colTrading}</div>
              <div className="px-4 py-3 text-muted">{c.compare.colGambling}</div>
            </div>
            {c.compare.rows.map((row, i) => (
              <div
                key={row.trading.slice(0, 20)}
                className={`grid grid-cols-2 text-sm ${i < c.compare.rows.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div className="border-r border-[var(--border)] bg-accent-soft/30 px-4 py-4 leading-relaxed text-[var(--foreground)]">
                  {row.trading}
                </div>
                <div className="px-4 py-4 leading-relaxed text-muted">{row.gambling}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <p className="section-kicker">{c.binary.kicker}</p>
        <h3 className="section-title mt-2 max-w-3xl">{c.binary.title}</h3>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
          {c.binary.paragraphs.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <p className="text-center font-mono text-xs font-medium tracking-wide text-accent md:text-sm">{c.binary.flow}</p>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted md:text-base">{c.binary.closing}</p>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            <p className="section-kicker">{c.mindset.kicker}</p>
          </div>
          <h3 className="section-title mt-2 max-w-3xl">{c.mindset.title}</h3>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-muted md:text-base">
            {c.mindset.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <article className="surface-panel mt-8 max-w-3xl p-5">
            <p className="text-sm font-semibold">{c.mindset.paramsLabel}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.mindset.paramsText}</p>
          </article>
        </div>
      </section>

      <section className="container-fluid py-12 md:py-14">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <p className="section-kicker">{c.process.kicker}</p>
        </div>
        <h3 className="section-title mt-2 max-w-3xl">{c.process.title}</h3>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {c.process.steps.map((step) => (
            <li key={step.num} className="surface-panel relative overflow-hidden p-5">
              <span className="font-display text-3xl font-semibold text-accent/20">{step.num}</span>
              <p className="mt-2 font-display text-base font-semibold">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card)]">
        <div className="container-fluid py-12 md:py-14">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent" />
            <p className="section-kicker">{c.curriculum.kicker}</p>
          </div>
          <h3 className="section-title mt-2 max-w-3xl">{c.curriculum.title}</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.curriculum.items.map((item, i) => (
              <article key={item.title} className="surface-panel p-5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 font-display text-base font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-fluid py-12 pb-16 md:py-16">
        <div className="rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,var(--accent-soft),transparent_60%)] p-6 md:p-10">
          <div className="flex items-start gap-3">
            <BarChart3 className="mt-1 h-5 w-5 shrink-0 text-accent" />
            <div className="max-w-3xl">
              <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{c.closing.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">{c.closing.body}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{c.closing.disclaimerLabel}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted md:text-sm">{c.closing.disclaimerBody}</p>
        </div>
      </section>
    </div>
  );
}
