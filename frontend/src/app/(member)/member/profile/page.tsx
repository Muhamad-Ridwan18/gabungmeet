"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { updateProfile } from "@/services/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { MemberPanel } from "@/components/member/MemberChrome";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ROUTES } from "@/constants";
import { membershipCta } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export default function ProfilePage() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const cta = membershipCta(user?.status);

  const [email, setEmail] = useState(user?.email ?? "");
  const [fullName, setFullName] = useState(user?.profile?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    setEmail(user?.email ?? "");
    setFullName(user?.profile?.full_name ?? "");
  }, [user?.email, user?.profile?.full_name]);

  const initials =
    fullName
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SP";

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.account")}
        title={t("member.profileTitle")}
        description={t("member.profileDesc")}
      />

      <MemberPanel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white">
              {initials}
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">
                {user?.profile?.full_name || t("status.member")}
              </p>
              <p className="mt-1 text-sm text-muted">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {user?.status ? <StatusBadge label={user.status} tone={statusTone(user.status)} /> : null}
                {user?.role ? <StatusBadge label={user.role} tone="muted" /> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user?.status !== "verified" ? (
              <Link href={cta.href} className="btn-primary">
                {t(cta.labelKey)}
              </Link>
            ) : null}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                clearSession();
                window.location.href = ROUTES.login;
              }}
            >
              {t("common.signOut")}
            </button>
          </div>
        </div>

        <form
          className="mt-8 space-y-4 border-t border-[var(--border)] pt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void (async () => {
              setBusy(true);
              setError(null);
              setOk(null);
              try {
                const payload: {
                  email?: string;
                  full_name?: string;
                  current_password?: string;
                  password?: string;
                } = {
                  email: email.trim(),
                  full_name: fullName.trim(),
                };
                if (password) {
                  payload.current_password = currentPassword;
                  payload.password = password;
                }
                const res = await updateProfile(payload);
                if (!res.success || !res.data) {
                  setError(res.message || t("admin.saveFailed"));
                  return;
                }
                setUser(res.data);
                setCurrentPassword("");
                setPassword("");
                setOk(t("member.profileUpdated"));
              } catch {
                setError(t("admin.saveFailed"));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          <p className="text-sm font-medium">{t("member.editAccount")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("auth.email")}</span>
              <input
                className="field-input"
                type="email"
                autoComplete="email"
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
              <span className="text-muted">{t("member.currentPassword")}</span>
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">
                {t("auth.newPassword")}{" "}
                <span className="text-muted/70">({t("common.optional")})</span>
              </span>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={password ? 8 : undefined} />
            </label>
          </div>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {ok ? <p className="text-sm text-accent">{ok}</p> : null}
          <button type="submit" disabled={busy} className="btn-primary">
            {t("common.save")}
          </button>
        </form>

        <dl className="mt-8 grid gap-5 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("member.telegram")}</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.telegram_username || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("member.phone")}</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("member.timezone")}</dt>
            <dd className="mt-1.5 text-sm">{user?.profile?.timezone || "UTC"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("member.memberSince")}</dt>
            <dd className="mt-1.5 text-sm">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </dd>
          </div>
        </dl>
      </MemberPanel>
    </div>
  );
}
