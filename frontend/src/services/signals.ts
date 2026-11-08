import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type SignalItem = {
  id: string;
  pair: string;
  direction: "buy" | "sell" | string;
  entry: number;
  sl?: number | null;
  tp?: number | null;
  status: "active" | "closed" | "cancelled" | string;
  result?: "win" | "loss" | "be" | string | null;
  analysis?: string | null;
  chart_key?: string | null;
  published_at: string;
  created_by: string;
  created_at: string;
};

export type SignalInput = {
  pair: string;
  direction: string;
  entry: number;
  sl?: number | null;
  tp?: number | null;
  status?: string;
  result?: string | null;
  analysis?: string | null;
  chart_key?: string | null;
};

export async function listSignals(params?: { status?: string; page?: number }) {
  const { data } = await api.get<ApiEnvelope<SignalItem[]>>("/signals", { params });
  return data;
}

export async function getSignal(id: string) {
  const { data } = await api.get<ApiEnvelope<SignalItem>>(`/signals/${id}`);
  return data;
}

export async function adminListSignals(params?: { status?: string; page?: number }) {
  const { data } = await api.get<ApiEnvelope<SignalItem[]>>("/admin/signals", { params });
  return data;
}

export async function adminCreateSignal(input: SignalInput) {
  const { data } = await api.post<ApiEnvelope<SignalItem>>("/admin/signals", input);
  return data;
}

export async function adminUpdateSignal(id: string, input: SignalInput) {
  const { data } = await api.put<ApiEnvelope<SignalItem>>(`/admin/signals/${id}`, input);
  return data;
}

export async function adminPatchSignalStatus(id: string, input: { status: string; result?: string | null }) {
  const { data } = await api.patch<ApiEnvelope<SignalItem>>(`/admin/signals/${id}/status`, input);
  return data;
}
