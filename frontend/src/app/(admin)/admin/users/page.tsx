"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminDeleteUser,
  adminGetUser,
  adminListUsers,
  adminLockUser,
  adminUnlockUser,
  adminUpdateUser,
} from "@/services/users";
import type { User } from "@/types/auth";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { PasswordInput } from "@/components/forms/PasswordInput";
import {
  AdminBleed,
  AdminEmpty,
  AdminFilterSeg,
  AdminListRow,
  AdminPageHeader,
  AdminSplit,
} from "@/components/admin/AdminChrome";
import { useT } from "@/i18n/useT";

const STATUS_VALUES = ["", "registered", "onboarding", "pending_verification", "verified", "rejected", "locked"];

export default function AdminUsersPage() {
  const { t, ts, tr } = useT();
  const FILTERS = STATUS_VALUES.map((value) => ({
    value,
    label: value ? ts(value) : t("common.all"),
  }));

  const [items, setItems] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminListUsers({
        status: status || undefined,
        q: q.trim() || undefined,
        page: 1,
      });
      if (res.success && res.data) {
        setItems(res.data);
        if (selected && !res.data.some((i) => i.id === selected)) {
          setSelected(null);
          setDetail(null);
        }
      } else setError(res.message);
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, selected]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const openDetail = async (id: string) => {
    setSelected(id);
    setError(null);
    setOk(null);
    setPassword("");
    try {
      const res = await adminGetUser(id);
      if (res.success && res.data) {
        setDetail(res.data);
        setEmail(res.data.email);
        setFullName(res.data.profile?.full_name ?? "");
      }
    } catch {
      setError(t("admin.loadFailed"));
    }
  };

  return (
    <AdminBleed>
      <AdminPageHeader
        title={t("admin.usersTitle")}
        description={t("admin.usersDesc")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="field-input h-9 w-44 text-sm"
              placeholder={t("common.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
            />
            <button type="button" className="btn-ghost h-9 px-3 text-sm" onClick={() => void load()}>
              {t("common.search")}
            </button>
            <AdminFilterSeg
              value={status}
              options={FILTERS}
              onChange={(v) => {
                setStatus(v);
                setSelected(null);
                setDetail(null);
              }}
            />
          </div>
        }
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border-b border-accent/20 bg-accent-soft/40 px-4 py-2 text-sm text-accent md:px-6 lg:px-8">{ok}</p>
      ) : null}

      <AdminSplit
        list={
          <>
            <div className="hidden grid-cols-[1.4fr_1fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
              <span>{t("admin.member")}</span>
              <span>{t("auth.email")}</span>
              <span className="text-right">{t("common.status")}</span>
            </div>
            {loading ? (
              <div className="space-y-2 p-4 md:p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--surface-2)]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <AdminEmpty title={t("admin.noUsers")} description={t("admin.emptyFilter")} />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {items.map((item) => (
                  <li key={item.id}>
                    <AdminListRow
                      active={selected === item.id}
                      onClick={() => void openDetail(item.id)}
                      className="md:grid-cols-[1.4fr_1fr_auto]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.profile?.full_name || t("status.member")}
                        </p>
                        <p className="truncate text-xs text-muted md:hidden">{item.email}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{tr(item.created_at)}</p>
                      </div>
                      <p className="hidden truncate text-sm text-muted md:block">{item.email}</p>
                      <div className="md:justify-self-end">
                        <StatusBadge label={item.status} tone={statusTone(item.status)} />
                      </div>
                    </AdminListRow>
                  </li>
                ))}
              </ul>
            )}
          </>
        }
        detail={
          !detail ? (
            <AdminEmpty title={t("admin.selectUser")} description={t("admin.openRowHint")} />
          ) : (
            <>
              <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold">
                      {detail.profile?.full_name || t("status.member")}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted">{detail.email}</p>
                  </div>
                  <StatusBadge label={detail.status} tone={statusTone(detail.status)} />
                </div>
              </div>

              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  void (async () => {
                    if (!selected) return;
                    setBusy(true);
                    setError(null);
                    setOk(null);
                    try {
                      const payload: {
                        email: string;
                        full_name: string;
                        password?: string;
                      } = {
                        email: email.trim(),
                        full_name: fullName.trim(),
                      };
                      if (password.trim()) payload.password = password.trim();
                      const res = await adminUpdateUser(selected, payload);
                      if (!res.success || !res.data) {
                        setError(res.message || t("admin.saveFailed"));
                        return;
                      }
                      setDetail(res.data);
                      setPassword("");
                      setOk(t("admin.userUpdated"));
                      await load();
                    } catch {
                      setError(t("admin.saveFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
                  <label className="block space-y-1.5 text-sm">
                    <span className="text-muted">{t("auth.email")}</span>
                    <input
                      className="field-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="text-muted">{t("member.username")}</span>
                    <input
                      className="field-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      minLength={2}
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="text-muted">
                      {t("auth.newPassword")}{" "}
                      <span className="text-muted/70">({t("common.optional")})</span>
                    </span>
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={password ? 8 : undefined}
                    />
                  </label>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {t("admin.accountStatus")}
                      </dt>
                      <dd className="mt-1 capitalize">{ts(detail.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t("admin.role")}</dt>
                      <dd className="mt-1">{detail.role}</dd>
                    </div>
                  </dl>
                </div>

                <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-[var(--border)] bg-[var(--card)] px-5 py-4 md:px-6">
                  <button type="submit" disabled={busy} className="btn-primary flex-1 py-2.5">
                    {t("admin.saveChanges")}
                  </button>
                  {detail.status === "locked" ? (
                    <button
                      type="button"
                      disabled={busy}
                      className="btn-ghost"
                      onClick={() =>
                        void (async () => {
                          if (!selected) return;
                          setBusy(true);
                          setError(null);
                          try {
                            await adminUnlockUser(selected);
                            await openDetail(selected);
                            await load();
                            setOk(t("admin.userUnlocked"));
                          } catch {
                            setError(t("admin.actionFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("admin.unlock")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded-xl border border-[var(--danger)] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/5 disabled:opacity-50"
                      onClick={() =>
                        void (async () => {
                          if (!selected) return;
                          setBusy(true);
                          setError(null);
                          try {
                            await adminLockUser(selected);
                            await openDetail(selected);
                            await load();
                            setOk(t("admin.userLocked"));
                          } catch {
                            setError(t("admin.actionFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("admin.lock")}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || !selected}
                    className="font-medium text-[var(--danger)] hover:underline disabled:opacity-50"
                    onClick={() =>
                      void (async () => {
                        if (!selected) return;
                        setBusy(true);
                        setError(null);
                        setOk(null);
                        try {
                          await adminDeleteUser(selected);
                          setDetail(null);
                          setSelected(null);
                          setOk(t("admin.userDeleted"));
                          await load();
                        } catch {
                          setError(t("admin.deleteFailed"));
                        } finally {
                          setBusy(false);
                        }
                      })()
                    }
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </form>
            </>
          )
        }
      />
    </AdminBleed>
  );
}
