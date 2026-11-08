import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";
import type { HookVideo, HookVideoKind } from "@/services/landing";
import { adminUploadMemberVideo } from "@/services/member-home";

export type OnboardingVideoSlot = HookVideo;

export type AdminOnboardingVideoSlot = {
  title: string;
  video_url?: string | null;
  video_key?: string | null;
  is_active: boolean;
  kind?: HookVideoKind | null;
};

export type AdminOnboardingVideos = {
  broker_tutorial: AdminOnboardingVideoSlot;
  deposit_tutorial: AdminOnboardingVideoSlot;
  updated_at?: string | null;
};

export async function adminGetOnboardingVideos() {
  const { data } = await api.get<ApiEnvelope<AdminOnboardingVideos>>("/admin/onboarding/videos");
  return data;
}

export async function adminUpdateOnboardingVideos(input: {
  broker_tutorial?: Partial<AdminOnboardingVideoSlot & { video_key?: string; video_url?: string }>;
  deposit_tutorial?: Partial<AdminOnboardingVideoSlot & { video_key?: string; video_url?: string }>;
}) {
  const { data } = await api.put<ApiEnvelope<AdminOnboardingVideos>>("/admin/onboarding/videos", input);
  return data;
}

export { adminUploadMemberVideo as adminUploadOnboardingVideo };
