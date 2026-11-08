"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { TermsAcceptanceModal } from "@/components/auth/TermsAcceptanceModal";
import { register as registerUser } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/constants";
import { NEW_MEMBER_FLAG } from "@/lib/auth-routing";
import { track } from "@/lib/analytics";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { useT } from "@/i18n/useT";

type FormValues = {
  full_name: string;
  email: string;
  whatsapp: string;
  password: string;
};

export default function RegisterPage() {
  const { t } = useT();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(2, t("auth.fullName")),
        email: z.string().email(),
        whatsapp: z
          .string()
          .min(8, t("auth.whatsappInvalid"))
          .max(30, t("auth.whatsappInvalid"))
          .regex(/^\+?[0-9\s\-()]{8,30}$/, t("auth.whatsappInvalid")),
        password: z.string().min(8, "Min 8 characters"),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const completeRegistration = async (values: FormValues) => {
    setError(null);
    setRegistering(true);
    try {
      const res = await registerUser({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        whatsapp: values.whatsapp.trim(),
        accept_terms: true,
      });
      if (!res.success || !res.data) {
        setError(res.message || t("auth.registerFailed"));
        return;
      }
      setSession(res.data.user, res.data.tokens.access_token, res.data.tokens.refresh_token);
      sessionStorage.setItem(NEW_MEMBER_FLAG, "1");
      track("signup_complete", { status: res.data.user.status });
      setTermsOpen(false);
      router.push(ROUTES.member);
    } catch {
      setError(t("auth.registerError"));
    } finally {
      setRegistering(false);
    }
  };

  const onSubmit = handleSubmit((values) => {
    setError(null);
    setPendingValues(values);
    setTermsOpen(true);
  });

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_100%_0%,var(--glow),transparent_55%)]" />
        <div className="relative">
          <div className="absolute right-0 top-0 flex items-center gap-1.5">
            <LocaleToggle />
            <ThemeToggle />
          </div>
          <h1 className="font-display pr-28 text-3xl font-semibold tracking-tight">{t("auth.createAccount")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.createAccountBody")}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("auth.fullName")}</span>
              <input className="field-input" autoComplete="name" {...register("full_name")} />
              {errors.full_name ? <span className="text-[var(--danger)]">{errors.full_name.message}</span> : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("auth.email")}</span>
              <input type="email" className="field-input" autoComplete="email" {...register("email")} />
              {errors.email ? <span className="text-[var(--danger)]">{errors.email.message}</span> : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("auth.whatsapp")}</span>
              <input
                type="tel"
                inputMode="tel"
                className="field-input"
                autoComplete="tel"
                placeholder={t("auth.whatsappHint")}
                {...register("whatsapp")}
              />
              {errors.whatsapp ? <span className="text-[var(--danger)]">{errors.whatsapp.message}</span> : null}
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("auth.password")}</span>
              <PasswordInput autoComplete="new-password" {...register("password")} />
              {errors.password ? <span className="text-[var(--danger)]">{errors.password.message}</span> : null}
            </label>

            <p className="text-xs leading-relaxed text-muted">
              {t("auth.termsRegisterNote")}{" "}
              <Link href={ROUTES.terms} target="_blank" className="font-medium text-accent hover:underline">
                {t("auth.termsTitle")}
              </Link>
              .
            </p>

            {error ? (
              <p className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={registering} className="btn-primary w-full py-3 disabled:opacity-50">
              {registering ? t("auth.creating") : t("auth.createAccount")}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {t("auth.alreadyHave")}{" "}
            <Link href={ROUTES.login} className="text-accent hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>

      <TermsAcceptanceModal
        open={termsOpen}
        busy={registering}
        onClose={() => {
          if (registering) return;
          setTermsOpen(false);
        }}
        onConfirm={() => {
          if (!pendingValues) return;
          void completeRegistration(pendingValues);
        }}
      />
    </>
  );
}
