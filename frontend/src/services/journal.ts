import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type JournalItem = {
  id: string;
  user_id: string;
  traded_at: string;
  pair: string;
  direction: string;
  entry?: number | null;
  exit?: number | null;
  sl?: number | null;
  tp?: number | null;
  result?: string | null;
  rr?: number | null;
  notes?: string | null;
  emotion?: string | null;
  screenshot_key?: string | null;
  created_at: string;
};

export type JournalInput = {
  traded_at: string;
  pair: string;
  direction: string;
  entry?: number | null;
  exit?: number | null;
  sl?: number | null;
  tp?: number | null;
  result?: string | null;
  rr?: number | null;
  notes?: string | null;
  emotion?: string | null;
  screenshot_key?: string | null;
};

export async function listJournals(params?: { page?: number }) {
  const { data } = await api.get<ApiEnvelope<JournalItem[]>>("/journals", { params });
  return data;
}

export async function createJournal(input: JournalInput) {
  const { data } = await api.post<ApiEnvelope<JournalItem>>("/journals", input);
  return data;
}

export async function updateJournal(id: string, input: JournalInput) {
  const { data } = await api.put<ApiEnvelope<JournalItem>>(`/journals/${id}`, input);
  return data;
}

export async function deleteJournal(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/journals/${id}`);
  return data;
}
