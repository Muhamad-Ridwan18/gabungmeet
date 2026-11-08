"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { forgotPassword } from "@/services/auth";
import { ROUTES } from "@/constants";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { useT } from "@/i18n/useT";

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    const res = await forgotPassword(email);
    setMessage(res.message);
    setDevToken(res.data?.dev_reset_token ?? null);
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_0%,var(--glow),transparent_55%)]" />
      <div className="relative">
        <div className="absolute right-0 top-0 flex items-center gap-1.5">
          <LocaleToggle />
          <ThemeToggle />
        </div>
        <h1 className="font-display pr-28 text-3xl font-semibold tracking-tight">{t("auth.forgotTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.forgotBody")}</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.email")}</span>
            <input type="email" className="field-input" autoComplete="email" {...register("email")} />
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {t("auth.sendReset")}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        {devToken ? (
          <p className="mt-2 break-all text-xs text-accent">
            Dev token: {devToken} — use on{" "}
            <Link href={ROUTES.resetPassword} className="underline">
              reset page
            </Link>
          </p>
        ) : null}
        <Link href={ROUTES.login} className="mt-6 inline-block text-sm text-muted hover:text-accent">
          {t("auth.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
