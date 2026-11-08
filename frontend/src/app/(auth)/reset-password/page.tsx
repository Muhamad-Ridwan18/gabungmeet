"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { resetPassword } from "@/services/auth";
import { ROUTES } from "@/constants";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { useT } from "@/i18n/useT";

const schema = z.object({
  token: z.string().min(10),
  new_password: z.string().min(8),
});

export default function ResetPasswordPage() {
  const { t } = useT();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await resetPassword(values.token, values.new_password);
      setMessage(res.message);
    } catch {
      setError(t("auth.invalidToken"));
    }
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_0%,var(--glow),transparent_55%)]" />
      <div className="relative">
        <div className="absolute right-0 top-0 flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <h1 className="font-display pr-28 text-3xl font-semibold tracking-tight">{t("auth.resetTitle")}</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.token")}</span>
            <input className="field-input" {...register("token")} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.newPassword")}</span>
            <PasswordInput autoComplete="new-password" {...register("new_password")} />
          </label>
          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {message ? <p className="text-sm text-accent">{message}</p> : null}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {t("auth.updatePassword")}
          </button>
        </form>
        <Link href={ROUTES.login} className="mt-6 inline-block text-sm text-muted hover:text-accent">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
