"use client";

import { useEffect, useState } from "react";
import { LockedModule } from "@/components/member/LockedModule";
import { RiskDisclosureGate } from "@/components/member/RiskDisclosureGate";
import { createJournal, deleteJournal, listJournals, type JournalItem } from "@/services/journal";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberList, MemberListRow, MemberPanel } from "@/components/member/MemberChrome";
import { useT } from "@/i18n/useT";

function numOrNull(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function JournalPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);
  const [items, setItems] = useState<JournalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState("buy");
  const [tradedAt, setTradedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [emotion, setEmotion] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listJournals();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || t("member.noJournalBody"));
    } catch {
      setError(t("member.noJournalBody"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!unlocked) {
      setLoading(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  if (!unlocked) return <LockedModule title={t("member.journalTitle")} />;

  return (
    <RiskDisclosureGate>
      <div className="space-y-6">
      <PageHeader
        kicker={t("member.privateLog")}
        title={t("member.journalTitle")}
        description={t("member.journalDesc")}
      />

      <MemberPanel title={t("member.newEntry")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="field-input"
            type="datetime-local"
            value={tradedAt}
            onChange={(e) => setTradedAt(e.target.value)}
          />
          <input
            className="field-input"
            placeholder={t("member.pair")}
            value={pair}
            onChange={(e) => setPair(e.target.value)}
          />
          <select className="field-input" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="buy">{t("status.buy")}</option>
            <option value="sell">{t("status.sell")}</option>
          </select>
          <select className="field-input" value={result} onChange={(e) => setResult(e.target.value)}>
            <option value="">{t("member.resultOptional")}</option>
            <option value="win">{t("status.win")}</option>
            <option value="loss">{t("status.loss")}</option>
            <option value="be">{t("status.be")}</option>
          </select>
          <input
            className="field-input"
            placeholder={t("member.entry")}
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
          <input
            className="field-input"
            placeholder={t("member.exit")}
            value={exit}
            onChange={(e) => setExit(e.target.value)}
          />
          <input
            className="field-input"
            placeholder={t("member.emotion")}
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
          />
          <textarea
            className="field-input min-h-[88px] sm:col-span-2"
            placeholder={t("member.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={() =>
            void (async () => {
              await createJournal({
                traded_at: new Date(tradedAt).toISOString(),
                pair,
                direction,
                entry: numOrNull(entry),
                exit: numOrNull(exit),
                result: result || null,
                notes: notes || null,
                emotion: emotion || null,
              });
              setNotes("");
              setEmotion("");
              setEntry("");
              setExit("");
              setResult("");
              await load();
            })()
          }
        >
          {t("member.saveEntry")}
        </button>
      </MemberPanel>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <SkeletonRows /> : null}
      {!loading && items.length === 0 ? (
        <EmptyState title={t("member.noJournalTitle")} description={t("member.noJournalBody")} />
      ) : null}

      {!loading && items.length > 0 ? (
        <MemberList>
          {items.map((j) => (
            <MemberListRow key={j.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {j.pair} · {j.direction.toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(j.traded_at).toLocaleString()}
                    {j.entry != null ? ` · ${t("member.entry")} ${j.entry}` : ""}
                    {j.exit != null ? ` · ${t("member.exit")} ${j.exit}` : ""}
                  </p>
                  {j.result ? (
                    <div className="mt-2">
                      <StatusBadge label={j.result} tone={statusTone(j.result)} />
                    </div>
                  ) : null}
                  {j.emotion ? <p className="mt-2 text-sm text-accent">{j.emotion}</p> : null}
                  {j.notes ? <p className="mt-2 text-sm text-muted">{j.notes}</p> : null}
                </div>
                <button
                  type="button"
                  className="text-sm text-[var(--danger)] transition hover:opacity-80"
                  onClick={() =>
                    void (async () => {
                      await deleteJournal(j.id);
                      await load();
                    })()
                  }
                >
                  {t("common.delete")}
                </button>
              </div>
            </MemberListRow>
          ))}
        </MemberList>
      ) : null}
      </div>
    </RiskDisclosureGate>
  );
}
