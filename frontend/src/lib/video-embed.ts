export type EmbedUrlOptions = {
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
};

export function toEmbedUrl(url: string, options?: EmbedUrlOptions): string {
  const autoplay = options?.autoplay ?? false;
  const muted = options?.muted ?? false;
  const loop = options?.loop ?? false;
  const controls = options?.controls ?? true;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      let videoId = parsed.searchParams.get("v");
      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] ?? null;
      }
      if (videoId) {
        const params = new URLSearchParams({
          autoplay: autoplay ? "1" : "0",
          mute: muted ? "1" : "0",
          playsinline: "1",
          modestbranding: "1",
          rel: "0",
          controls: controls ? "1" : "0",
        });
        if (loop) {
          params.set("loop", "1");
          params.set("playlist", videoId);
        }
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
    }

    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "");
      if (videoId) {
        const params = new URLSearchParams({
          autoplay: autoplay ? "1" : "0",
          mute: muted ? "1" : "0",
          playsinline: "1",
          modestbranding: "1",
          rel: "0",
          controls: controls ? "1" : "0",
        });
        if (loop) {
          params.set("loop", "1");
          params.set("playlist", videoId);
        }
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const videoId = segments[segments.length - 1];
      if (videoId) {
        const params = new URLSearchParams({
          autoplay: autoplay ? "1" : "0",
          muted: muted ? "1" : "0",
          loop: loop ? "1" : "0",
        });
        if (autoplay && muted) {
          params.set("background", "1");
        }
        return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
      }
    }

    parsed.searchParams.set("autoplay", autoplay ? "1" : "0");
    parsed.searchParams.set("mute", muted ? "1" : "0");
    parsed.searchParams.set("playsinline", "1");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function toAutoplayEmbedUrl(url: string, options?: { muted?: boolean }): string {
  return toEmbedUrl(url, {
    autoplay: true,
    muted: options?.muted ?? false,
    loop: true,
    controls: options?.muted ? false : true,
  });
}
