import type { CSSProperties } from "react";

/** Deterministic cover backgrounds when no thumbnail_url is set. */
const TONES = [
  "linear-gradient(145deg, rgba(0,82,255,0.55), transparent 48%), linear-gradient(160deg, #0b1220, #152238)",
  "linear-gradient(145deg, rgba(14,116,144,0.5), transparent 50%), linear-gradient(160deg, #0c1924, #123040)",
  "linear-gradient(145deg, rgba(30,64,175,0.55), transparent 45%), linear-gradient(200deg, #111827, #1e293b)",
  "linear-gradient(145deg, rgba(2,132,199,0.45), transparent 50%), linear-gradient(170deg, #0f172a, #1e3a5f)",
  "linear-gradient(145deg, rgba(67,56,202,0.4), transparent 50%), linear-gradient(180deg, #0b1220, #1a2744)",
  "linear-gradient(145deg, rgba(0,82,255,0.35), transparent 55%), linear-gradient(135deg, #102a43, #243b55)",
];

const SOFT = [
  "linear-gradient(135deg, var(--accent-soft), #dbe7ff)",
  "linear-gradient(135deg, #e0f2fe, #dbe7ff)",
  "linear-gradient(135deg, #eef2ff, #dbeafe)",
  "linear-gradient(135deg, #e0e7ff, #f0f9ff)",
];

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function mediaCoverStyle(seed: string, thumbnailUrl?: string | null): CSSProperties {
  if (thumbnailUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.65)), url(${thumbnailUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: TONES[hash(seed) % TONES.length] };
}

export function articleCoverStyle(seed: string, thumbnailUrl?: string | null): CSSProperties {
  if (thumbnailUrl) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundImage: SOFT[hash(seed) % SOFT.length] };
}
