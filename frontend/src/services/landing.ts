import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type HookVideoKind = "file" | "embed";

export type HookVideo = {
  title: string;
  video_url: string;
  kind: HookVideoKind;
};

export type AdminHookVideo = {
  title: string;
  video_url?: string | null;
  video_key?: string | null;
  is_active: boolean;
  kind?: HookVideoKind | null;
  updated_at?: string | null;
};

export async function getHookVideo() {
  const { data } = await api.get<ApiEnvelope<HookVideo | null>>("/landing/hook-video");
  return data;
}

export async function adminGetHookVideo() {
  const { data } = await api.get<ApiEnvelope<AdminHookVideo>>("/admin/landing/hook-video");
  return data;
}

export async function adminUpdateHookVideo(input: {
  title?: string;
  video_url?: string;
  video_key?: string;
  is_active?: boolean;
}) {
  const { data } = await api.put<ApiEnvelope<AdminHookVideo>>("/admin/landing/hook-video", input);
  return data;
}

export async function adminUploadHookVideo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads/video", form, {
    timeout: 120_000,
  });
  return data;
}

/* ---------- Editable landing page content ---------- */

export type LandingLocale = "id" | "en";

export type LandingSectionKind = "text" | "cards" | "steps" | "chips" | "compare";

export type LandingItem = { title: string; body: string };

export type LandingSectionText = {
  kicker: string;
  title: string;
  /** Rich text (HTML) from the admin editor. */
  body: string;
  /** Column headers, used by the "compare" kind only. */
  col_a: string;
  col_b: string;
  items: LandingItem[];
};

export type LandingSection = {
  key: string;
  kind: LandingSectionKind;
  enabled: boolean;
  i18n: Record<LandingLocale, LandingSectionText>;
};

export type LandingHero = {
  badge: string;
  title_a: string;
  title_b: string;
  subtitle: string;
  body: string;
  cta: string;
};

export type LandingCta = { title: string; body: string; button: string; login: string };

export type LandingDisclaimer = { label: string; body: string };

export type LandingContent = {
  hero: Record<LandingLocale, LandingHero>;
  sections: LandingSection[];
  cta: Record<LandingLocale, LandingCta>;
  disclaimer: Record<LandingLocale, LandingDisclaimer>;
  updated_at?: string | null;
};

export async function getLandingContent() {
  const { data } = await api.get<ApiEnvelope<LandingContent | null>>("/landing/content");
  return data;
}

export async function adminGetLandingContent() {
  const { data } = await api.get<ApiEnvelope<{ configured: boolean; content: LandingContent | null }>>(
    "/admin/landing/content",
  );
  return data;
}

export async function adminUpdateLandingContent(input: Omit<LandingContent, "updated_at">) {
  const { data } = await api.put<ApiEnvelope<{ configured: boolean; content: LandingContent | null }>>(
    "/admin/landing/content",
    input,
  );
  return data;
}
