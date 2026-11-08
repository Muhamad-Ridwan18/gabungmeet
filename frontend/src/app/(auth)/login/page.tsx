"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import axios from "axios";
import { login } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ROUTES, API_URL } from "@/constants";
import { postAuthRoute } from "@/lib/auth-routing";
import { track } from "@/lib/analytics";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { useT } from "@/i18n/useT";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useT();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await login(values);
      if (!res.success || !res.data) {
        setError(res.message || t("auth.loginFailed"));
        return;
      }
      setSession(res.data.user, res.data.tokens.access_token, res.data.tokens.refresh_token);
      const { user } = res.data;
      track("login_complete", { status: user.status, role: user.role });
      router.push(postAuthRoute(user));
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        if (typeof msg === "string" && msg) {
          setError(msg);
          return;
        }
        const target = `${err.config?.baseURL ?? API_URL}${err.config?.url ?? ""}`;
        const status = err.response?.status;
        setError(
          err.code === "ERR_NETWORK"
            ? `Cannot reach API (${target}). Check backend is running and NEXT_PUBLIC_API_URL is set.`
            : status
              ? `API error ${status} (${target}). ${typeof err.response?.data?.message === "string" ? err.response.data.message : err.message}`
              : err.message || "Cannot reach API.",
        );
        return;
      }
      setError(t("auth.invalidCredentials"));
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
        <h1 className="font-display pr-28 text-3xl font-semibold tracking-tight">{t("auth.welcomeBack")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.welcomeBody")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.email")}</span>
            <input type="email" className="field-input" autoComplete="email" {...register("email")} />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted">{t("auth.password")}</span>
            <PasswordInput autoComplete="current-password" {...register("password")} />
          </label>
          <label className="flex items-center gap-2.5 text-sm text-muted">
            <input type="checkbox" className="accent-[var(--accent)]" {...register("remember")} />
            {t("auth.rememberMe")}
          </label>
          {error ? (
            <p className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm text-muted">
          <Link href={ROUTES.forgotPassword} className="hover:text-accent">
            {t("auth.forgotPassword")}
          </Link>
          <Link href={ROUTES.register} className="hover:text-accent">
            {t("auth.createAccount")}
          </Link>
        </div>
      </div>
    </div>
  );
}
