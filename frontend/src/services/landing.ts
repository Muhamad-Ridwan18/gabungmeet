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
