"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Send, Sparkles } from "lucide-react";
import { LockedModule } from "@/components/member/LockedModule";
import { getTelegramLink, listBonuses, type BonusItem } from "@/services/bonus";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/i18n/useT";

export default function BonusPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);
  const [items, setItems] = useState<BonusItem[]>([]);
  const [telegram, setTelegram] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) {
      setLoading(false);
      return;
    }
    let alive = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [bRes, tRes] = await Promise.all([listBonuses(), getTelegramLink()]);
        if (!alive) return;
        if (bRes.success && bRes.data) setItems(bRes.data);
        if (tRes.success && tRes.data?.telegram_invite_url) setTelegram(tRes.data.telegram_invite_url);
        if (!bRes.success) setError(bRes.message || t("member.noBonusesAdminBody"));
      } catch {
        if (alive) setError(t("member.noBonusesAdminBody"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [unlocked, t]);

  if (!unlocked) return <LockedModule title={t("member.bonusTitle")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.memberPerks")}
        title={t("member.bonusTitle")}
        description={t("member.bonusDesc")}
        actions={
          telegram ? (
            <a href={telegram} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
              <Send className="h-4 w-4" />
              {t("member.joinTelegram")}
            </a>
          ) : null
        }
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState title={t("member.noBonusesTitle")} description={t("member.noBonusesAdminBody")} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((b) => (
          <article
            key={b.id}
            className="group rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-accent/30"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold tracking-tight">{b.title}</h2>
            {b.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{b.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
              {b.file_url ? (
                <a
                  className="inline-flex items-center gap-1.5 text-accent hover:underline"
                  href={b.file_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("common.download")}
                </a>
              ) : null}
              {b.external_url ? (
                <a
                  className="inline-flex items-center gap-1.5 text-accent hover:underline"
                  href={b.external_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("common.openLink")}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
