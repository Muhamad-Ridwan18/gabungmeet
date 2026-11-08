import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_id?: string | null;
  sender_type: "user" | "admin" | "system" | string;
  message: string;
  attachment_key?: string | null;
  created_at: string;
};

export type Ticket = {
  id: string;
  user_id?: string | null;
  name: string;
  telegram_username: string;
  email?: string | null;
  topic: string;
  description: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
};

export type CreateTicketInput = {
  name: string;
  telegram_username?: string;
  email?: string;
  topic: string;
  description: string;
};

export async function createTicket(input: CreateTicketInput) {
  const { data } = await api.post<ApiEnvelope<Ticket>>("/tickets", input);
  return data;
}

export async function listMyTickets() {
  const { data } = await api.get<ApiEnvelope<Ticket[]>>("/tickets/me");
  return data;
}

export async function getTicket(id: string) {
  const { data } = await api.get<ApiEnvelope<Ticket>>(`/tickets/${id}`);
  return data;
}

export async function addTicketMessage(id: string, message: string) {
  const { data } = await api.post<ApiEnvelope<TicketMessage>>(`/tickets/${id}/messages`, { message });
  return data;
}

export async function adminListTickets(params?: { status?: string; page?: number }) {
  const { data } = await api.get<ApiEnvelope<Ticket[]>>("/admin/tickets", { params });
  return data;
}

export async function adminPatchTicketStatus(id: string, status: string) {
  const { data } = await api.patch<ApiEnvelope<Ticket>>(`/admin/tickets/${id}/status`, { status });
  return data;
}
