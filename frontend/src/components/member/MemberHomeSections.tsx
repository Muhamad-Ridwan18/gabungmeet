"use client";

import { useCallback, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import type { MemberHomeContent } from "@/services/member-home";
import { useT } from "@/i18n/useT";

type Props = {
  content: MemberHomeContent;
  firstName: string;
};

type ActiveVideo = "welcome" | "tutorial" | null;

function qrFallbackUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
}

const VIDEO_FRAME = "aspect-video w-full";
const VIDEO_WRAP = "mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--border)]";

export function MemberHomeSections({ content, firstName }: Props) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveVideo>(null);

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleWelcomePlay = useCallback(() => setActiveVideo("welcome"), []);
  const handleTutorialPlay = useCallback(() => setActiveVideo("tutorial"), []);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-5 sm:px-5">
        <p className="section-kicker">{t("member.memberDesk")}</p>
        <h1 className="font-display mt-1.5 text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
          {t("member.welcomeBack", { name: firstName })}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("member.homeIntro")}</p>
      </section>

      {content.welcome ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <div className="mb-3">
            <p className="section-kicker">{t("member.welcomeVideoKicker")}</p>
            <h2 className="font-display mt-1 text-lg font-semibold tracking-tight">{content.welcome.title}</h2>
            <p className="mt-1 text-xs text-muted">{t("member.tutorialTapToPlay")}</p>
          </div>
          <div className={VIDEO_WRAP}>
            <LandingHookVideoPlayer
              video={content.welcome}
              fallbackTitle={content.welcome.title}
              className={VIDEO_FRAME}
              autoPlay={false}
              loop={false}
              paused={activeVideo !== null && activeVideo !== "welcome"}
              onPlay={handleWelcomePlay}
            />
          </div>
        </section>
      ) : null}

      {content.referral ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <p className="section-kicker">{t("member.referralKicker")}</p>
          <h2 className="font-display mt-1 text-lg font-semibold tracking-tight">
            {content.referral.title || t("member.referralTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-muted">{t("member.referralBody")}</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                {t("member.referralLink")}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className="field-input min-w-0 flex-1 text-sm" readOnly value={content.referral.link} />
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  onClick={() => void copyLink(content.referral!.link)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("member.referralCopied") : t("member.referralCopy")}
                </button>
              </div>
              <a
                href={content.referral.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                {t("member.referralOpen")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mx-auto shrink-0 rounded-xl border border-[var(--border)] bg-white p-2.5 sm:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.referral.barcode_url || qrFallbackUrl(content.referral.link)}
                alt={t("member.referralBarcodeAlt")}
                className="h-32 w-32 object-contain sm:h-36 sm:w-36"
              />
            </div>
          </div>
        </section>
      ) : null}

      {content.tutorial ? (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <div className="mb-3">
            <p className="section-kicker">{t("member.tutorialVideoKicker")}</p>
            <h2 className="font-display mt-1 text-lg font-semibold tracking-tight">{content.tutorial.title}</h2>
            <p className="mt-1 text-xs text-muted">{t("member.tutorialTapToPlay")}</p>
          </div>
          <div className={VIDEO_WRAP}>
            <LandingHookVideoPlayer
              video={content.tutorial}
              fallbackTitle={content.tutorial.title}
              className={VIDEO_FRAME}
              autoPlay={false}
              loop={false}
              paused={activeVideo !== null && activeVideo !== "tutorial"}
              onPlay={handleTutorialPlay}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
