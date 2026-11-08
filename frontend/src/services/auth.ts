import { api } from "@/lib/api";
import type { ApiEnvelope, AuthPayload, User } from "@/types/auth";

export async function register(input: {
  email: string;
  password: string;
  full_name: string;
  whatsapp: string;
  accept_terms: boolean;
}) {
  const { data } = await api.post<ApiEnvelope<AuthPayload>>("/auth/register", input);
  return data;
}

export async function login(input: {
  email: string;
  password: string;
  remember?: boolean;
}) {
  const { data } = await api.post<ApiEnvelope<AuthPayload>>("/auth/login", input);
  return data;
}

export async function me() {
  const { data } = await api.get<ApiEnvelope<User>>("/auth/me");
  return data;
}

export async function updateProfile(input: {
  email?: string;
  full_name?: string;
  current_password?: string;
  password?: string;
}) {
  const { data } = await api.patch<ApiEnvelope<User>>("/auth/me", input);
  return data;
}

export async function logout(refreshToken?: string) {
  const { data } = await api.post<ApiEnvelope<null>>("/auth/logout", {
    refresh_token: refreshToken,
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiEnvelope<{ sent: boolean; dev_reset_token?: string }>>(
    "/auth/forgot-password",
    { email },
  );
  return data;
}

export async function resetPassword(token: string, new_password: string) {
  const { data } = await api.post<ApiEnvelope<null>>("/auth/reset-password", {
    token,
    new_password,
  });
  return data;
}
