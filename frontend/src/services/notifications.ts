import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type NotificationItem = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
};

export async function listNotifications() {
  const { data } = await api.get<ApiEnvelope<NotificationItem[]>>("/notifications");
  return data;
}
