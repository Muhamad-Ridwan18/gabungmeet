"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, Star } from "lucide-react";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import type { MarketQuote } from "@/components/landing/landing-types";
import { LandingXauusdEducation } from "@/components/marketing/LandingXauusdEducation";
import { ROUTES } from "@/constants";
import { track } from "@/lib/analytics";
import { getHookVideo, type HookVideo } from "@/services/landing";
import { useT } from "@/i18n/useT";

export default function LandingPage() {
  const { t, locale } = useT();
  const [hookVideo, setHookVideo] = useState<HookVideo | null>(null);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [marketLive, setMarketLive] = useState(false);

  async function loadQuotes(signal?: AbortSignal) {
    const res = await fetch("/api/market", { cache: "no-store", signal });
    const json = (await res.json()) as { ok?: boolean; data?: MarketQuote[] };
    if (json.ok && json.data && json.data.length > 0) {
      setQuotes(json.data);
      setMarketLive(true);
    } else {
      setQuotes([]);
      setMarketLive(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await getHookVideo();
        if (!alive) return;
        setHookVideo(res.success && res.data ? res.data : null);
      } catch {
        if (alive) setHookVideo(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadQuotes(controller.signal).catch(() => {
      setMarketLive(false);
    });
    const timer = window.setInterval(() => {
      void loadQuotes(controller.signal).catch(() => {
        setMarketLive(false);
      });
    }, 45_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const copy =
    locale === "id"
      ? {
          badge: "#1 Community Trading",
          heroTitleA: "Santara",
          heroTitleB: "Pips",
          heroSub: "Grow Your Pips, The Santara Way.",
          heroBody:
            "Komunitas trading dengan edukasi, analisis pasar, dan sinyal yang membantu Anda tumbuh lebih terarah.",
          joinNow: "Daftar Gratis",
          ctaTitle: "Siap mulai perjalanan trading Anda?",
          ctaBody:
            "Daftar gratis, pelajari materi edukasi, lalu selesaikan verifikasi saat siap membuka fitur premium.",
          ctaBtn: "Daftar Sekarang",
        }
      : {
          badge: "#1 Community Trading",
          heroTitleA: "Santara",
          heroTitleB: "Pips",
          heroSub: "Grow Your Pips, The Santara Way.",
          heroBody:
            "A trading community with education, market analysis, and signals that help you grow with clearer direction.",
          joinNow: "Register Free",
          ctaTitle: "Ready to start your trading journey?",
          ctaBody:
            "Register free, study the education material, then complete verification when you're ready for premium access.",
          ctaBtn: "Register Now",
        };

  const displayQuotes = quotes.length > 0 ? quotes : [];

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_18%_18%,rgba(197,160,89,0.12),transparent_55%),radial-gradient(ellipse_50%_40%_at_85%_10%,rgba(0,82,255,0.2),transparent_58%)] dark:bg-[radial-gradient(ellipse_55%_45%_at_18%_18%,rgba(197,160,89,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_85%_10%,rgba(59,130,246,0.22),transparent_58%)]" />

        {marketLive && displayQuotes.length > 0 ? (
          <div className="border-b border-[var(--border)]/70 bg-[var(--card)]/55 backdrop-blur">
            <div className="container-fluid overflow-hidden">
              <div className="market-ticker py-2.5">
                {[...displayQuotes, ...displayQuotes].map((quote, i) => {
                  const positive = quote.change >= 0;
                  return (
                    <div
                      key={`${quote.symbol}-${i}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[11px]"
                    >
                      <span className="font-semibold">{quote.symbol}</span>
                      <span className="text-muted">
                        {quote.close >= 100 ? quote.close.toLocaleString() : quote.close.toFixed(4)}
                      </span>
                      <span className={positive ? "text-emerald-500" : "text-rose-500"}>
                        {positive ? "+" : ""}
                        {quote.percent_change.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        <div className="container-fluid relative pb-12 pt-12 md:pb-16 md:pt-14">
          <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c5a059]/35 bg-[#c5a059]/10 px-3 py-1 text-[11px] font-semibold text-[#c5a059]">
                <Star className="h-3 w-3 fill-current" />
                {copy.badge}
              </span>

              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
                {copy.heroTitleA}{" "}
                <span className="text-[#c5a059]">{copy.heroTitleB}</span>
              </h1>
              <p className="mt-3 text-base font-medium text-[var(--foreground)] md:text-lg">{copy.heroSub}</p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted md:text-[15px]">{copy.heroBody}</p>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link
                  href={ROUTES.register}
                  className="btn-primary gap-2 px-5 py-2.5"
                  onClick={() => track("cta_click", { source: "hero" })}
                >
                  {copy.joinNow}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div
              id="hook"
              className="animate-rise-delay relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(140deg,#0b1326,#0b1532)] p-2 text-white shadow-[0_24px_80px_rgba(10,20,48,0.5)] sm:p-3"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/35 blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10">
                {hookVideo?.video_url ? (
                  <LandingHookVideoPlayer
                    video={hookVideo}
                    fallbackTitle={t("landing.hookTitle")}
                    className="aspect-[16/10] w-full md:aspect-[16/9]"
                    autoPlay={false}
                    loop={false}
                  />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center gap-2 bg-[#0d1833]/90 text-white/90 md:aspect-[16/9]">
                    <Play className="h-5 w-5 fill-current" />
                    <p className="text-sm font-medium">{t("landing.hookTitle")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="education">
        <LandingXauusdEducation />
      </div>

      <section className="container-fluid pb-24 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,#0052ff,#003bb8)] px-6 py-12 text-center text-white md:px-14">
          <div className="pointer-events-none absolute -left-12 top-0 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight md:text-4xl">{copy.ctaTitle}</h2>
          <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">
            {copy.ctaBody}
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-2.5">
            <Link
              href={ROUTES.register}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-accent"
              onClick={() => track("cta_click", { source: "footer_cta" })}
            >
              {copy.ctaBtn}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {locale === "id" ? "Masuk Member" : "Member Login"}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
