import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type ChatReply = {
  reply: string;
  redirect_path?: string | null;
  need_human: boolean;
  suggested_ticket_topic?: string | null;
  session_key: string;
  conversation_id: string;
};

export async function sendChat(message: string, sessionKey?: string) {
  const { data } = await api.post<ApiEnvelope<ChatReply>>("/ai/chat", {
    message,
    session_key: sessionKey || undefined,
  });
  return data;
}
