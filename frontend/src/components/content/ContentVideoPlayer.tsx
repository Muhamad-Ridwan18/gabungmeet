"use client";

import { toEmbedUrl } from "@/lib/video-embed";
import { useT } from "@/i18n/useT";

function isFileVideo(url: string) {
  try {
    const path = new URL(url, "https://example.com").pathname.toLowerCase();
    return /\.(mp4|webm|mov)$/i.test(path) || path.includes("/uploads/video/");
  } catch {
    return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/uploads/video/");
  }
}

function isEmbeddable(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("youtube.com") || host === "youtu.be" || host.includes("vimeo.com");
  } catch {
    return false;
  }
}

export function ContentVideoPlayer({ url }: { url?: string | null }) {
  const { t } = useT();

  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0b1220]">
        <p className="text-sm text-white/60">{t("member.videoMissing")}</p>
      </div>
    );
  }

  if (isFileVideo(url)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0b1220]">
        <video controls playsInline className="aspect-video w-full" src={url} />
      </div>
    );
  }

  if (isEmbeddable(url)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0b1220]">
        <iframe
          title="Video"
          src={toEmbedUrl(url, { autoplay: false, muted: false, controls: true })}
          className="aspect-video w-full"
          allow="encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#0b1220]">
      <video controls playsInline className="aspect-video w-full" src={url} />
    </div>
  );
}
