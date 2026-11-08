"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Send } from "lucide-react";
import { LockedModule } from "@/components/member/LockedModule";
import { getTelegramLink } from "@/services/bonus";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/i18n/useT";

export default function SignalsPage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);
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
        const res = await getTelegramLink();
        if (!alive) return;
        if (res.success && res.data?.telegram_invite_url) {
          setTelegram(res.data.telegram_invite_url);
        } else {
          setError(res.message || t("member.signalsTelegramUnavailable"));
        }
      } catch {
        if (alive) setError(t("member.signalsTelegramUnavailable"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [unlocked, t]);

  if (!unlocked) return <LockedModule title={t("member.signalsTitle")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.liveDesk")}
        title={t("member.signalsTitle")}
        description={t("member.signalsDesc")}
      />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      {loading ? <Skeleton className="h-40" /> : null}

      {!loading && !telegram ? (
        <EmptyState title={t("member.noSignalsTitle")} description={t("member.signalsTelegramUnavailable")} />
      ) : null}

      {!loading && telegram ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Send className="h-5 w-5" />
          </div>
          <h2 className="font-display mt-4 text-xl font-semibold tracking-tight">{t("member.signalsTelegramTitle")}</h2>
          <p className="mt-2 max-w-lg text-sm text-muted">{t("member.signalsTelegramBody")}</p>
          <a
            href={telegram}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-2.5"
          >
            {t("member.openSignalsTelegram")}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
