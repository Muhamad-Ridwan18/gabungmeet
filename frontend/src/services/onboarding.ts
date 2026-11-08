import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type OnboardingSettings = {
  ib_register_url: string;
  telegram_invite_url: string;
  broker_tutorial_url: string;
  deposit_tutorial_url: string;
  broker_tutorial?: {
    title: string;
    video_url: string;
    kind: "embed" | "file";
  } | null;
  deposit_tutorial?: {
    title: string;
    video_url: string;
    kind: "embed" | "file";
  } | null;
};

export type VerificationRequest = {
  id: string;
  user_id: string;
  mt5_account: string;
  broker_server: string;
  proof_key?: string | null;
  proof_url?: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  user_email?: string;
  user_full_name?: string;
  user_phone?: string;
};

export type OnboardingProgress = {
  current_step: number;
  status: string;
  step1_done_at?: string | null;
  step2_done_at?: string | null;
  step3_done_at?: string | null;
  step4_done_at?: string | null;
  step5_done_at?: string | null;
  completed_at?: string | null;
  settings: OnboardingSettings;
  latest_verification?: VerificationRequest | null;
};

export async function getOnboarding() {
  const { data } = await api.get<ApiEnvelope<OnboardingProgress>>("/onboarding");
  return data;
}

export async function startOnboarding() {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/start");
  return data;
}

export async function completeStep1() {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/step/1/complete");
  return data;
}

export async function completeStep2() {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/step/2/complete");
  return data;
}

export async function submitStep3(input: { mt5_account: string; broker_server: string }) {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/step/3", input);
  return data;
}

export async function completeStep4(input: { proof_key: string }) {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/step/4", input);
  return data;
}

export async function completeStep5() {
  const { data } = await api.post<ApiEnvelope<OnboardingProgress>>("/onboarding/step/5/complete");
  return data;
}

export async function uploadProof(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/uploads?purpose=proof", form, {
    timeout: 60_000,
  });
  return data;
}

export async function resubmitVerification() {
  const { data } = await api.post<ApiEnvelope<null>>("/verifications/resubmit");
  return data;
}

export async function listAdminVerifications(params?: { status?: string; page?: number }) {
  const { data } = await api.get<ApiEnvelope<VerificationRequest[]>>("/admin/verifications", { params });
  return data;
}

export async function getAdminVerification(id: string) {
  const { data } = await api.get<
    ApiEnvelope<{
      request: VerificationRequest;
      user: { id: string; email: string; status: string; profile?: { full_name: string } };
    }>
  >(`/admin/verifications/${id}`);
  return data;
}

export async function approveVerification(id: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/verifications/${id}/approve`);
  return data;
}

export async function rejectVerification(id: string, reason: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/verifications/${id}/reject`, { reason });
  return data;
}

export async function deleteVerification(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/admin/verifications/${id}`);
  return data;
}

export async function lockUser(id: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/users/${id}/lock`);
  return data;
}

export async function unlockUser(id: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/users/${id}/unlock`);
  return data;
}
