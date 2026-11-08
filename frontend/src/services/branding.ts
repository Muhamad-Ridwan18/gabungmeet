import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type PublicBranding = {
  logo_url: string | null;
};

export type AdminBranding = {
  logo_key: string | null;
  logo_url: string | null;
  updated_at?: string | null;
};

export async function getBranding() {
  const { data } = await api.get<ApiEnvelope<PublicBranding>>("/settings/branding");
  return data;
}

export async function adminGetBranding() {
  const { data } = await api.get<ApiEnvelope<AdminBranding>>("/admin/branding");
  return data;
}

export async function adminUpdateBranding(input: { logo_key?: string | null }) {
  const { data } = await api.put<ApiEnvelope<AdminBranding>>("/admin/branding", input);
  return data;
}

export async function adminUploadLogo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads?purpose=logo", form, {
    timeout: 60_000,
  });
  return data;
}
