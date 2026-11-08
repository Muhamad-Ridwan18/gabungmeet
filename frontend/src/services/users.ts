import { api } from "@/lib/api";
import type { ApiEnvelope, User } from "@/types/auth";

export async function adminListUsers(params?: { status?: string; q?: string; page?: number }) {
  const { data } = await api.get<ApiEnvelope<User[]>>("/admin/users", { params });
  return data;
}

export async function adminGetUser(id: string) {
  const { data } = await api.get<ApiEnvelope<User>>(`/admin/users/${id}`);
  return data;
}

export async function adminUpdateUser(
  id: string,
  input: {
    email?: string;
    full_name?: string;
    password?: string;
    status?: string;
    role?: string;
  },
) {
  const { data } = await api.patch<ApiEnvelope<User>>(`/admin/users/${id}`, input);
  return data;
}

export async function adminLockUser(id: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/users/${id}/lock`);
  return data;
}

export async function adminUnlockUser(id: string) {
  const { data } = await api.post<ApiEnvelope<null>>(`/admin/users/${id}/unlock`);
  return data;
}

export async function adminDeleteUser(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/admin/users/${id}`);
  return data;
}
