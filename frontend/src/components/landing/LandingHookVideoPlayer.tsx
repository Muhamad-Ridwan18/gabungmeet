"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { toAutoplayEmbedUrl, toEmbedUrl } from "@/lib/video-embed";
import type { HookVideo } from "@/services/landing";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";

type Props = {
  video: HookVideo;
  fallbackTitle: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
  showSoundToggle?: boolean;
  onPlay?: () => void;
  paused?: boolean;
};

export function LandingHookVideoPlayer({
  video,
  fallbackTitle,
  className,
  autoPlay = true,
  loop = true,
  showControls,
  showSoundToggle = true,
  onPlay,
  paused = false,
}: Props) {
  const { t } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [embedSrc, setEmbedSrc] = useState(() =>
    autoPlay
      ? toAutoplayEmbedUrl(video.video_url, { muted: false })
      : toEmbedUrl(video.video_url, { autoplay: false, muted: true, loop, controls: true }),
  );

  const title = video.title || fallbackTitle;
  const frameClass = className ?? "aspect-video w-full";
  const useCustomControls = video.kind === "file";
  const controls = showControls ?? (!autoPlay && !useCustomControls);

  useEffect(() => {
    setPlaying(false);
  }, [video.video_url, video.kind]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || video.kind !== "file") return;

    if (paused) {
      el.pause();
      return;
    }

    if (!autoPlay) return;

    el.muted = false;
    el.volume = 1;
    void el.play()
      .then(() => onPlay?.())
      .catch(() => {
        el.muted = true;
        setMuted(true);
        void el.play()
          .then(() => onPlay?.())
          .catch(() => {
            /* ignore */
          });
      });
  }, [video.video_url, video.kind, autoPlay, paused, onPlay]);

  useEffect(() => {
    if (video.kind !== "embed" || !paused) return;
    setEmbedSrc(toEmbedUrl(video.video_url, { autoplay: false, muted: true, loop, controls: true }));
  }, [paused, video.kind, video.video_url, loop]);

  const toggleSound = () => {
    const nextMuted = !muted;

    if (video.kind === "file" && videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        void videoRef.current.play().catch(() => {
          /* ignore */
        });
      }
      setMuted(nextMuted);
      return;
    }

    setMuted(nextMuted);
    setEmbedSrc(
      autoPlay
        ? toAutoplayEmbedUrl(video.video_url, { muted: nextMuted })
        : toEmbedUrl(video.video_url, { autoplay: false, muted: nextMuted, loop, controls: true }),
    );
  };

  const handleVideoPlay = () => {
    setPlaying(true);
    onPlay?.();
  };

  const handleVideoPause = () => {
    setPlaying(false);
  };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      el.muted = muted;
      void el.play()
        .then(() => {
          if (!muted) {
            el.muted = false;
            el.volume = 1;
          }
        })
        .catch(() => {
          el.muted = true;
          setMuted(true);
          void el.play().catch(() => {
            /* ignore */
          });
        });
    } else {
      el.pause();
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
      }
    }

    setMuted(nextMuted);
  };

  return (
    <div className="group relative overflow-hidden bg-black">
      {video.kind === "embed" ? (
        <iframe
          key={embedSrc}
          title={title}
          src={embedSrc}
          className={frameClass}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <video
            ref={videoRef}
            className={cn(frameClass, "object-contain")}
            src={video.video_url}
            autoPlay={autoPlay && !paused}
            loop={loop}
            playsInline
            muted={muted}
            controls={controls && !useCustomControls}
            preload={autoPlay ? "auto" : "metadata"}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onClick={useCustomControls ? togglePlay : undefined}
          />

          {useCustomControls ? (
            <>
              {!playing ? (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25 transition hover:bg-black/35"
                  aria-label={t("landing.play")}
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white shadow-lg backdrop-blur transition group-hover:scale-105">
                    <Play className="ml-0.5 h-7 w-7 fill-current" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 z-[1] cursor-pointer opacity-0"
                  aria-label={t("landing.pause")}
                />
              )}

              <div className="absolute inset-x-0 bottom-0 z-[3] flex items-center gap-2 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-3 pb-3 pt-8">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                  aria-label={playing ? t("landing.pause") : t("landing.play")}
                >
                  {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>
                <p className="min-w-0 flex-1 truncate text-xs font-medium text-white/90">{title}</p>
                {showSoundToggle ? (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                    aria-label={muted ? t("landing.unmute") : t("landing.mute")}
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </>
      )}

      {showSoundToggle && autoPlay ? (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/75"
          aria-label={muted ? t("landing.unmute") : t("landing.mute")}
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {muted ? t("landing.unmute") : t("landing.mute")}
        </button>
      ) : null}
    </div>
  );
}
