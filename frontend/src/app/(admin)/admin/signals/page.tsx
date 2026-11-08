"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";
import { useT } from "@/i18n/useT";

async function getAdminTelegramLink() {
  const { data } = await api.get<ApiEnvelope<{ telegram_invite_url: string }>>("/admin/signals");
  return data;
}

async function saveAdminTelegramLink(telegram_invite_url: string) {
  const { data } = await api.put<ApiEnvelope<{ telegram_invite_url: string }>>("/admin/signals", {
    telegram_invite_url,
  });
  return data;
}

export default function AdminSignalsPage() {
  const { t } = useT();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await getAdminTelegramLink();
      if (res.success && res.data) {
        setUrl(res.data.telegram_invite_url || "");
      } else {
        setError(res.message || t("admin.loadFailed"));
      }
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await saveAdminTelegramLink(url.trim());
      if (!res.success) throw new Error(res.message || "save failed");
      setUrl(res.data?.telegram_invite_url || url.trim());
      setSuccess(t("admin.signalsTelegramSaved"));
    } catch {
      setError(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <AdminPageHeader title={t("admin.signalsTitle")} description={t("admin.signalsDesc")} />

      {error ? (
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-display text-lg font-semibold">{t("admin.signalsTelegramSection")}</h3>
        <p className="text-sm text-muted">{t("admin.signalsTelegramHint")}</p>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted">{t("admin.signalsTelegramUrl")}</span>
          <input
            className="field-input w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://t.me/..."
            disabled={loading || busy}
          />
        </label>
        <button
          type="button"
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
          disabled={loading || busy}
          onClick={() => void save()}
        >
          {busy ? t("common.loading") : t("common.save")}
        </button>
      </section>
    </div>
  );
}
