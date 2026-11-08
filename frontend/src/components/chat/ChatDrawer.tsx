"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Ticket } from "lucide-react";
import { sendChat } from "@/services/ai";
import { ROUTES } from "@/constants";
import { Sheet } from "@/components/ui/Sheet";
import { useT } from "@/i18n/useT";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  text: string;
  redirectPath?: string | null;
  needHuman?: boolean;
  topic?: string | null;
};

const SESSION_KEY = "ib_ai_session";
const SUGGESTION_KEYS = ["chat.sugDeposit", "chat.sugMt5", "chat.sugTelegram", "chat.sugSignals"] as const;

export function ChatDrawer() {
  const { t, locale } = useT();
  const pathname = usePathname();
  const hideOnAdmin = pathname?.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionKey, setSessionKey] = useState("");
  const [telegram] = useState("https://t.me/ibcommunity");
  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "assistant",
      text: t("chat.welcome"),
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => prev.map((m) => (m.id === "welcome" ? { ...m, text: t("chat.welcome") } : m)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) setSessionKey(existing);
  }, []);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    if (!preset) setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    try {
      const res = await sendChat(text, sessionKey || undefined);
      if (res.success && res.data) {
        if (res.data.session_key) {
          setSessionKey(res.data.session_key);
          localStorage.setItem(SESSION_KEY, res.data.session_key);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: res.data.reply,
            redirectPath: res.data.redirect_path,
            needHuman: res.data.need_human,
            topic: res.data.suggested_ticket_topic,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", text: res.message || t("chat.failReply") },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", text: t("chat.connectionFailed") },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (hideOnAdmin) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:opacity-90"
          aria-label={t("chat.openAria")}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      ) : null}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="right"
        title={t("chat.title")}
        description={t("chat.description")}
        widthClassName="w-full max-w-full sm:max-w-[560px]"
      >
        <div className="grid h-full min-h-0 flex-1 grid-cols-1 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-0 flex-col border-[var(--border)] md:border-r">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-4 py-3">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
                  onClick={() => void send(t(key))}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-accent text-white" : "bg-[var(--surface-2)] text-[var(--foreground)]"
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.redirectPath ? (
                      <Link
                        href={m.redirectPath}
                        className="mt-2 inline-flex rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => setOpen(false)}
                      >
                        {t("chat.openPage")}
                      </Link>
                    ) : null}
                    {m.needHuman ? (
                      <Link
                        href={`${ROUTES.support}?topic=${encodeURIComponent(m.topic || t("member.generalSupport"))}`}
                        className="mt-2 block text-xs font-medium text-accent underline"
                        onClick={() => setOpen(false)}
                      >
                        {t("chat.needHuman")}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form
              className="border-t border-[var(--border)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <div className="flex gap-2">
                <input
                  className="field-input"
                  placeholder={busy ? t("chat.thinking") : t("chat.placeholder")}
                  value={input}
                  disabled={busy}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="btn-primary shrink-0" disabled={busy}>
                  {t("common.send")}
                </button>
              </div>
            </form>
          </div>

          <aside className="hidden flex-col gap-3 bg-[var(--surface-2)] p-4 md:flex">
            <p className="font-display text-sm font-semibold">{t("chat.noAnswerTitle")}</p>
            <p className="text-xs leading-relaxed text-muted">{t("chat.noAnswerBody")}</p>
            <Link
              href={`${ROUTES.support}?topic=AI%20escalation`}
              className="btn-primary inline-flex items-center justify-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Ticket className="h-4 w-4" />
              {t("chat.createTicket")}
            </Link>
            <a
              href={telegram}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {t("chat.contactTelegram")}
            </a>
          </aside>
        </div>
      </Sheet>
    </>
  );
}

export const ChatWidget = ChatDrawer;
