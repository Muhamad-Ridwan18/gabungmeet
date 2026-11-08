"use client";

import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { AppLogo } from "@/components/layout/AppLogo";
import {
  adminGetBranding,
  adminUpdateBranding,
  adminUploadLogo,
  type AdminBranding,
} from "@/services/branding";
import { useBrandingStore } from "@/store/branding";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";

export default function AdminBrandingPage() {
  const { t } = useT();
  const setLogoUrl = useBrandingStore((s) => s.setLogoUrl);
  const [data, setData] = useState<AdminBranding | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const previewUrl = pendingUrl || data?.logo_url || null;

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminGetBranding();
      if (res.success && res.data) {
        setData(res.data);
        setPendingUrl(null);
        setUploadName(null);
        setLogoUrl(res.data.logo_url ?? null);
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

  const persistLogo = async (logoKey: string | null) => {
    const res = await adminUpdateBranding({ logo_key: logoKey });
    if (!res.success) throw new Error(res.message);
    await load();
    setSuccess(t("admin.brandingSaved"));
    setError(null);
  };

  const uploadLogo = async (file: File) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const up = await adminUploadLogo(file);
      if (!up.success || !up.data) throw new Error("upload failed");
      setPendingUrl(up.data.url);
      setUploadName(file.name);
      setLogoUrl(up.data.url);
      await persistLogo(up.data.key);
    } catch {
      setError(t("admin.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const removeLogo = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await persistLogo(null);
      setPendingUrl(null);
      setUploadName(null);
      setLogoUrl(null);
    } catch {
      setError(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title={t("admin.brandingTitle")} description={t("admin.brandingDesc")} />

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
        <h3 className="font-display text-lg font-semibold">{t("admin.brandingLogoSection")}</h3>
        <p className="text-sm text-muted">{t("admin.brandingLogoHint")}</p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
            disabled={loading || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void uploadLogo(file);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            disabled={loading || busy}
            onClick={() => fileRef.current?.click()}
          >
            {t("admin.uploadLogo")}
          </button>
          {previewUrl ? (
            <button type="button" className="btn-secondary px-4 py-2 text-sm" disabled={loading || busy} onClick={() => void removeLogo()}>
              {t("admin.removeLogo")}
            </button>
          ) : null}
          {uploadName ? <span className="text-xs text-muted">{uploadName}</span> : null}
        </div>

        {previewUrl ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.brandingHeaderPreview")}</p>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <AppLogo href={ROUTES.home} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.brandingFaviconPreview")}</p>
              <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="favicon preview" className="h-8 w-8 object-contain" />
                <div className="flex items-center gap-2 text-sm text-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="favicon tab" className="h-4 w-4 object-contain opacity-80" />
                  <span>{t("admin.brandingFaviconTab")}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">{t("admin.brandingEmpty")}</p>
        )}
      </section>
    </div>
  );
}
