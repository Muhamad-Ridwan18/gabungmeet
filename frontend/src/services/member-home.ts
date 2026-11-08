import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";
import type { HookVideoKind } from "@/services/landing";

export type MemberVideoSlot = {
  title: string;
  video_url: string;
  kind: HookVideoKind;
};

export type MemberReferral = {
  title: string;
  link: string;
  barcode_url?: string | null;
};

export type MemberHomeContent = {
  welcome: MemberVideoSlot | null;
  tutorial: MemberVideoSlot | null;
  referral: MemberReferral | null;
};

export type AdminVideoSlot = {
  title: string;
  video_url?: string | null;
  video_key?: string | null;
  is_active: boolean;
  kind?: HookVideoKind | null;
};

export type AdminReferralSlot = {
  title: string;
  link: string;
  barcode_key?: string | null;
  barcode_url?: string | null;
  is_active: boolean;
};

export type AdminMemberHome = {
  welcome: AdminVideoSlot;
  tutorial: AdminVideoSlot;
  referral: AdminReferralSlot;
  updated_at?: string | null;
};

export async function getMemberHome() {
  const { data } = await api.get<ApiEnvelope<MemberHomeContent>>("/member/home");
  return data;
}

export async function adminGetMemberHome() {
  const { data } = await api.get<ApiEnvelope<AdminMemberHome>>("/admin/member/home");
  return data;
}

export async function adminUpdateMemberHome(input: {
  welcome?: Partial<AdminVideoSlot & { video_key?: string; video_url?: string }>;
  tutorial?: Partial<AdminVideoSlot & { video_key?: string; video_url?: string }>;
  referral?: Partial<AdminReferralSlot & { barcode_key?: string }>;
}) {
  const { data } = await api.put<ApiEnvelope<AdminMemberHome>>("/admin/member/home", input);
  return data;
}

export async function adminUploadMemberVideo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads/video", form, {
    timeout: 120_000,
  });
  return data;
}

export async function adminUploadBarcode(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads?purpose=thumbnail", form, {
    timeout: 60_000,
  });
  return data;
}
