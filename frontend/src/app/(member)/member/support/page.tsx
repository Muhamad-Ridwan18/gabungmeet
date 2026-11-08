"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addTicketMessage,
  createTicket,
  getTicket,
  listMyTickets,
  type Ticket,
} from "@/services/tickets";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MemberList, MemberListRow, MemberPanel } from "@/components/member/MemberChrome";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

function SupportInner() {
  const { t, ts } = useT();
  const search = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const preTopic = search.get("topic") || "";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [name, setName] = useState(user?.profile?.full_name || "");
  const [telegram, setTelegram] = useState(user?.profile?.telegram_username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [topic, setTopic] = useState(preTopic || t("member.generalSupport"));
  const [description, setDescription] = useState("");

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listMyTickets();
      if (res.success && res.data) setTickets(res.data);
    } catch {
      setError(t("member.ticketsLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (preTopic) setTopic(preTopic);
  }, [preTopic]);

  useEffect(() => {
    if (user?.profile?.full_name) setName(user.profile.full_name);
    if (user?.profile?.telegram_username) setTelegram(user.profile.telegram_username);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const openTicket = async (id: string) => {
    const res = await getTicket(id);
    if (res.success && res.data) setSelected(res.data);
  };

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)),
    [tickets],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.helpDesk")}
        title={t("member.supportTitle")}
        description={t("member.supportDesc")}
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <MemberPanel title={t("member.newTicket")}>
          <div className="space-y-3">
            <input
              className="field-input"
              placeholder={t("member.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="field-input"
              placeholder={t("member.telegram")}
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
            <input
              className="field-input"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="field-input"
              placeholder={t("member.topic")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <textarea
              className="field-input min-h-[120px]"
              placeholder={t("member.describeIssue")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void (async () => {
                  const res = await createTicket({
                    name,
                    telegram_username: telegram,
                    email,
                    topic,
                    description,
                  });
                  if (!res.success) {
                    setError(res.message || t("member.createTicketFailed"));
                    return;
                  }
                  setDescription("");
                  await load();
                  if (res.data) setSelected(res.data);
                })()
              }
            >
              {t("member.submitTicket")}
            </button>
          </div>
        </MemberPanel>

        <MemberPanel title={t("member.myTickets")}>
          {loading ? <Skeleton className="h-32" /> : null}
          {!loading && sorted.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent p-0 shadow-none"
              title={t("member.noTicketsTitle")}
              description={t("member.noTicketsBody")}
            />
          ) : null}
          {!loading && sorted.length > 0 ? (
            <MemberList className="border-0">
              {sorted.map((t) => (
                <MemberListRow
                  key={t.id}
                  onClick={() => void openTicket(t.id)}
                  className={cn(selected?.id === t.id && "bg-accent-soft/50")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <span className="font-medium">{t.topic}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {new Date(t.updated_at).toLocaleString()}
                      </span>
                    </span>
                    <StatusBadge label={t.status} tone={statusTone(t.status)} />
                  </div>
                </MemberListRow>
              ))}
            </MemberList>
          ) : null}
        </MemberPanel>
      </div>

      {selected ? (
        <MemberPanel
          title={selected.topic}
          actions={
            <div className="flex items-center gap-3">
              <StatusBadge label={selected.status} tone={statusTone(selected.status)} />
              <button type="button" className="text-sm text-muted hover:text-[var(--foreground)]" onClick={() => setSelected(null)}>
                {t("common.close")}
              </button>
            </div>
          }
        >
          <div className="max-h-80 space-y-2.5 overflow-y-auto">
            {(selected.messages || []).map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm",
                  m.sender_type === "admin" || m.sender_type === "system"
                    ? "bg-[var(--surface-2)]"
                    : "border border-[var(--border)]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{ts(m.sender_type)}</p>
                <p className="mt-1 leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>
          {selected.status !== "closed" ? (
            <div className="mt-4 flex gap-2">
              <input
                className="field-input"
                placeholder={t("member.reply")}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary shrink-0"
                onClick={() =>
                  void (async () => {
                    await addTicketMessage(selected.id, reply);
                    setReply("");
                    await openTicket(selected.id);
                    await load();
                  })()
                }
              >
                {t("common.send")}
              </button>
            </div>
          ) : null}
        </MemberPanel>
      ) : null}
    </div>
  );
}

export default function SupportPage() {
  const { t } = useT();
  return (
    <Suspense fallback={<p className="text-sm text-muted">{t("common.loading")}</p>}>
      <SupportInner />
    </Suspense>
  );
}
