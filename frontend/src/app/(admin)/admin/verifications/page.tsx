"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveVerification,
  deleteVerification,
  getAdminVerification,
  listAdminVerifications,
  rejectVerification,
  type VerificationRequest,
} from "@/services/onboarding";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminBleed,
  AdminEmpty,
  AdminFilterSeg,
  AdminListRow,
  AdminPageHeader,
  AdminSplit,
} from "@/components/admin/AdminChrome";

import { apiErrorMessage, cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

type Detail = {
  request: VerificationRequest;
  user: {
    id: string;
    email: string;
    status: string;
    profile?: {
      full_name: string;
      phone?: string | null;
      telegram_username?: string | null;
    };
  };
};

function whatsappHref(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export default function AdminVerificationsPage() {
  const { t, ts, tr } = useT();
  const FILTERS = [
    { value: "pending", label: t("admin.pending") },
    { value: "approved", label: t("admin.approved") },
    { value: "rejected", label: t("admin.rejected") },
    { value: "", label: t("common.all") },
  ];
  const [items, setItems] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await listAdminVerifications({
        status: status || undefined,
        page: 1,
      });
      if (res.success && res.data) {
        setItems(res.data);
        if (selected && !res.data.some((i) => i.id === selected)) {
          setSelected(null);
          setDetail(null);
        }
      } else setError(res.message);
    } catch (err) {
      setError(apiErrorMessage(err, t("admin.loadFailed")));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selected]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openDetail = async (id: string) => {
    setSelected(id);
    setReason("");
    setError(null);
    try {
      const res = await getAdminVerification(id);
      if (res.success && res.data) setDetail(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, t("admin.loadFailed")));
    }
  };

  return (
    <AdminBleed>
      <AdminPageHeader
        title={t("admin.verificationsTitle")}
        description={
          status === "pending" && !loading
            ? t("admin.inQueue", { n: items.length })
            : t("admin.verificationsDesc")
        }
        actions={
          <AdminFilterSeg
            value={status}
            options={FILTERS}
            onChange={(v) => {
              setStatus(v);
              setSelected(null);
              setDetail(null);
            }}
          />
        }
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <AdminSplit
        list={
          <>
            <div className="hidden grid-cols-[1.4fr_0.9fr_0.9fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
              <span>{t("admin.member")}</span>
              <span>{t("admin.mt5Short")}</span>
              <span>{t("admin.serverShort")}</span>
              <span className="text-right">{t("common.status")}</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4 md:p-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-[var(--surface-2)]"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <AdminEmpty
                title={t("admin.noRequests")}
                description={
                  status === "pending"
                    ? t("admin.pendingQueueClear")
                    : t("admin.emptyFilter")
                }
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((item) => {
                  const hours =
                    item.created_at && item.status === "pending"
                      ? (Date.now() - new Date(item.created_at).getTime()) /
                        36e5
                      : 0;
                  return (
                    <li key={item.id}>
                      <AdminListRow
                        active={selected === item.id}
                        onClick={() => void openDetail(item.id)}
                        className="md:grid-cols-[1.4fr_0.9fr_0.9fr_auto]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.user_full_name ||
                              item.user_email ||
                              t("status.member")}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {item.user_email || "—"}
                          </p>
                          {item.user_phone ? (
                            <p className="truncate text-xs text-muted">
                              {item.user_phone}
                            </p>
                          ) : null}
                          <p
                            className={cn(
                              "mt-0.5 text-[11px]",
                              hours > 24
                                ? "font-medium text-[var(--danger)]"
                                : "text-muted",
                            )}
                          >
                            {tr(item.created_at)}
                            {hours > 24 ? ` · ${t("admin.agingSuffix")}` : ""}
                          </p>
                        </div>
                        <p className="hidden font-mono text-sm md:block">
                          {item.mt5_account}
                        </p>
                        <p className="hidden truncate text-sm text-muted md:block">
                          {item.broker_server}
                        </p>
                        <div className="flex items-center gap-2 md:justify-self-end">
                          <span className="font-mono text-xs text-muted md:hidden">
                            {item.mt5_account}
                          </span>
                          <StatusBadge
                            label={item.status}
                            tone={statusTone(item.status)}
                          />
                        </div>
                      </AdminListRow>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        }
        detail={
          !detail ? (
            <AdminEmpty
              title={t("admin.selectVerification")}
              description={t("admin.openRowHint")}
            />
          ) : (
            <>
              <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold">
                      {detail.user.profile?.full_name || t("status.member")}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      {detail.user.email}
                    </p>
                  </div>
                  <StatusBadge
                    label={detail.request.status}
                    tone={statusTone(detail.request.status)}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.phoneWhatsApp")}
                    </dt>
                    <dd className="mt-1">
                      {detail.user.profile?.phone ? (
                        <div className="space-y-1">
                          <a
                            href={`tel:${detail.user.profile.phone.replace(/[^\d+]/g, "")}`}
                            className="font-mono text-base font-medium text-accent hover:underline"
                          >
                            {detail.user.profile.phone}
                          </a>
                          {whatsappHref(detail.user.profile.phone) ? (
                            <a
                              href={whatsappHref(detail.user.profile.phone)!}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs font-medium text-accent hover:underline"
                            >
                              {t("admin.openWhatsApp")}
                            </a>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted">{t("admin.noPhone")}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.mt5Short")}
                    </dt>
                    <dd className="mt-1 font-mono text-base font-medium">
                      {detail.request.mt5_account}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.serverShort")}
                    </dt>
                    <dd className="mt-1 text-base font-medium">
                      {detail.request.broker_server}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.accountStatus")}
                    </dt>
                    <dd className="mt-1 capitalize">
                      {ts(detail.user.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.submitted")}
                    </dt>
                    <dd className="mt-1">{tr(detail.request.created_at)}</dd>
                  </div>
                </dl>
                {detail.request.proof_url || detail.request.proof_key ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {t("admin.proofOnFile")}
                    </p>
                    {detail.request.proof_url &&
                    /\.(jpe?g|png|webp|gif)(\?|$)/i.test(
                      detail.request.proof_url,
                    ) ? (
                      <a
                        href={detail.request.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detail.request.proof_url}
                          alt={t("admin.proof")}
                          className="max-h-80 w-full object-contain bg-black/5"
                        />
                        <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-accent hover:underline">
                          {t("admin.openProofFull")}
                        </p>
                      </a>
                    ) : detail.request.proof_url ? (
                      <a
                        href={detail.request.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-accent hover:underline"
                      >
                        {t("admin.openProofFile")}
                      </a>
                    ) : (
                      <p className="break-all font-mono text-xs text-muted">
                        {detail.request.proof_key}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">{t("admin.noProof")}</p>
                )}
                {detail.request.rejection_reason ? (
                  <div className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 px-3 py-2.5 text-sm">
                    <p className="font-medium text-[var(--danger)]">
                      {t("admin.rejectionReason")}
                    </p>
                    <p className="mt-1 text-muted">
                      {detail.request.rejection_reason}
                    </p>
                  </div>
                ) : null}
                {detail.request.status === "pending" ? (
                  <label className="block space-y-1.5 text-sm">
                    <span className="text-muted">
                      {t("admin.rejectionReason")}
                    </span>
                    <textarea
                      className="field-input min-h-[100px]"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t("admin.requiredWhenRejecting")}
                    />
                  </label>
                ) : null}
              </div>
              <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 md:px-6">
                {detail.request.status === "pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      className="btn-primary flex-1 py-2.5"
                      onClick={() =>
                        void (async () => {
                          if (!selected) return;
                          setBusy(true);
                          setError(null);
                          try {
                            await approveVerification(selected);
                            setDetail(null);
                            setSelected(null);
                            await load();
                          } catch (err) {
                            setError(
                              apiErrorMessage(err, t("admin.actionFailed")),
                            );
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("admin.approve")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className="flex-1 rounded-xl border border-[var(--danger)] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/5 disabled:opacity-50"
                      onClick={() =>
                        void (async () => {
                          if (!selected || !reason.trim()) {
                            setError(t("admin.rejectionRequired"));
                            return;
                          }
                          setBusy(true);
                          setError(null);
                          try {
                            await rejectVerification(selected, reason.trim());
                            setDetail(null);
                            setSelected(null);
                            await load();
                          } catch (err) {
                            setError(
                              apiErrorMessage(err, t("admin.actionFailed")),
                            );
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("admin.reject")}
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  disabled={busy || !selected}
                  className="ml-auto font-medium text-[var(--danger)] hover:underline disabled:opacity-50"
                  onClick={() =>
                    void (async () => {
                      if (!selected) return;
                      setBusy(true);
                      setError(null);
                      try {
                        await deleteVerification(selected);
                        setDetail(null);
                        setSelected(null);
                        await load();
                      } catch (err) {
                        setError(apiErrorMessage(err, t("admin.deleteFailed")));
                      } finally {
                        setBusy(false);
                      }
                    })()
                  }
                >
                  {t("common.delete")}
                </button>
              </div>
            </>
          )
        }
      />
    </AdminBleed>
  );
}
