"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n/useT";

type Props = {
  url: string;
  title: string;
};

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (hover: none) and (pointer: coarse)").matches;
}

/**
 * Desktop browsers can embed PDFs in an iframe. iOS Safari / many mobile browsers
 * show a blank frame instead — use Google's embedded viewer there, with a native
 * open fallback (system PDF viewer) if the embed fails to load.
 */
export function ContentPdfViewer({ url, title }: Props) {
  const { t } = useT();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(isMobileViewport());
    update();
    const mq = window.matchMedia("(max-width: 767px), (hover: none) and (pointer: coarse)");
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const iframeSrc = useMemo(() => {
    if (mobile) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
    return `${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  }, [mobile, url]);

  return (
    <div className="-mx-4 overflow-hidden border-y border-[var(--border)] bg-white md:-mx-6 lg:-mx-8">
      {mobile ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
          <p className="text-xs text-muted">{t("member.pdfMobileHint")}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
          >
            {t("member.viewPdf")}
          </a>
        </div>
      ) : null}
      <iframe
        key={iframeSrc}
        title={title}
        src={iframeSrc}
        className="block h-[calc(100vh-8rem)] w-full min-h-[28rem] border-0 bg-white sm:min-h-[40rem]"
        allow="fullscreen"
      />
    </div>
  );
}
