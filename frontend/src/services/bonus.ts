import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type BonusItem = {
  id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  external_url?: string | null;
  is_active: boolean;
  sort_order: number;
};

export type BonusInput = {
  title: string;
  description?: string | null;
  file_key?: string | null;
  external_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export async function listBonuses() {
  const { data } = await api.get<ApiEnvelope<BonusItem[]>>("/bonuses");
  return data;
}

export async function getTelegramLink() {
  const { data } = await api.get<ApiEnvelope<{ telegram_invite_url: string }>>("/telegram-link");
  return data;
}

export async function adminListBonuses() {
  const { data } = await api.get<ApiEnvelope<BonusItem[]>>("/admin/bonuses");
  return data;
}

export async function adminCreateBonus(input: BonusInput) {
  const { data } = await api.post<ApiEnvelope<BonusItem>>("/admin/bonuses", input);
  return data;
}

export async function adminUpdateBonus(id: string, input: BonusInput) {
  const { data } = await api.put<ApiEnvelope<BonusItem>>(`/admin/bonuses/${id}`, input);
  return data;
}

export async function adminDeleteBonus(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/admin/bonuses/${id}`);
  return data;
}
