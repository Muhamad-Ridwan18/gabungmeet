"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  completeStep1,
  completeStep2,
  completeStep4,
  completeStep5,
  getOnboarding,
  resubmitVerification,
  startOnboarding,
  submitStep3,
  uploadProof,
  type OnboardingProgress,
} from "@/services/onboarding";
import { me } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { StepRail, WaitingTimeline } from "@/components/onboarding/StepRail";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import { Skeleton } from "@/components/ui/Skeleton";
import { AuthGate } from "@/components/common/AuthGate";
import { ROUTES, USER_STATUS } from "@/constants";
import { isBrowseOnly } from "@/lib/membership";
import { VERIFIED_WELCOME_FLAG } from "@/lib/auth-routing";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/useT";

export default function OnboardingPage() {
  return (
    <AuthGate>
      <OnboardingInner />
    </AuthGate>
  );
}

function OnboardingInner() {
  const { t } = useT();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);

  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [viewStep, setViewStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mt5, setMt5] = useState("");
  const [server, setServer] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!accessToken || !refreshToken) return;
    const res = await me();
    if (res.success && res.data) {
      setSession(res.data, accessToken, refreshToken);
      if (res.data.status === "verified") {
        sessionStorage.setItem(VERIFIED_WELCOME_FLAG, "1");
        router.replace(ROUTES.member);
      }
    }
  }, [accessToken, refreshToken, router, setSession]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOnboarding();
      if (!res.success || !res.data) {
        setError(res.message || t("onboarding.loadFailed"));
        return;
      }
      setProgress(res.data);
      setViewStep(res.data.current_step);
      if (res.data.latest_verification) {
        setMt5(res.data.latest_verification.mt5_account);
        setServer(res.data.latest_verification.broker_server);
      }
      if (res.data.status === "verified") router.replace(ROUTES.member);
    } catch {
      setError(t("onboarding.cannotLoad"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<{ success: boolean; message: string; data: OnboardingProgress | null }>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.success || !res.data) {
        setError(res.message || t("onboarding.actionFailed"));
        return;
      }
      setProgress(res.data);
      setViewStep(res.data.current_step);
      track("onboarding_step", { step: res.data.current_step });
      await refreshUser();
    } catch {
      setError(t("onboarding.requestFailed"));
    } finally {
      setBusy(false);
    }
  };

  const beginMembership = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await startOnboarding();
      if (!res.success || !res.data) {
        setError(res.message || t("onboarding.startFailed"));
        return;
      }
      setProgress(res.data);
      setViewStep(res.data.current_step);
      track("onboarding_start");
      await refreshUser();
    } catch {
      setError(t("onboarding.startFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-[240px_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[var(--danger)]">{error ?? t("onboarding.noProgress")}</p>
      </div>
    );
  }

  // Browse-first: show intro until user opts into IB verification.
  if (isBrowseOnly(progress.status) || progress.status === USER_STATUS.registered) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 md:py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <AppLogo href={ROUTES.member} />
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_100%_0%,var(--glow),transparent_55%)]" />
          <div className="relative">
          <p className="section-kicker">{t("onboarding.membership")}</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-[2.35rem]">
            {t("onboarding.becomeTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted md:text-[0.95rem]">
            {t("onboarding.becomeBody")}
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>{t("onboarding.list1")}</li>
            <li>{t("onboarding.list2")}</li>
            <li>{t("onboarding.list3")}</li>
            <li>{t("onboarding.list4")}</li>
            <li>{t("onboarding.list5")}</li>
          </ul>
          <div className="mt-6 rounded-xl border border-accent/20 bg-accent-soft/40 p-4">
            <p className="text-sm font-semibold text-accent">{t("onboarding.unlockTitle")}</p>
            <p className="mt-1.5 text-sm text-muted">{t("onboarding.unlockBody")}</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>{t("onboarding.unlock1")}</li>
              <li>{t("onboarding.unlock2")}</li>
              <li>{t("onboarding.unlock3")}</li>
              <li>{t("onboarding.unlock4")}</li>
              <li>{t("onboarding.unlock5")}</li>
            </ul>
          </div>
          {error ? (
            <p className="mt-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
              {error}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" disabled={busy} className="btn-primary px-6 py-3" onClick={() => void beginMembership()}>
              {busy ? t("onboarding.starting") : t("onboarding.startVerification")}
            </button>
            <Link href={ROUTES.member} className="btn-ghost px-6 py-3">
              {t("onboarding.backToDesk")}
            </Link>
          </div>
          </div>
        </div>
      </div>
    );
  }

  const step = progress.current_step;
  const view = Math.min(Math.max(viewStep, 1), step);
  const rejected = progress.status === "rejected";
  const pending = progress.status === "pending_verification";
  const canGoBack = !rejected && !pending && view > 1;
  const reviewingPast = !rejected && !pending && view < step;
  const supportHref = `${ROUTES.support}?topic=${encodeURIComponent(t("member.verificationHelpTopic"))}`;

  const goBack = () => setViewStep((s) => Math.max(1, Math.min(s, step) - 1));
  const goNext = () => setViewStep((s) => Math.min(step, Math.min(s, step) + 1));
  const selectStep = (n: number) => {
    if (n >= 1 && n <= step) setViewStep(n);
  };

  const submitMt5 = () => {
    const account = mt5.trim();
    const broker = server.trim();
    if (!/^\d{5,12}$/.test(account) || broker.length < 3) {
      setError(t("onboarding.mt5Invalid"));
      return;
    }
    void run(() => submitStep3({ mt5_account: account, broker_server: broker }));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 md:py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <AppLogo href={ROUTES.member} />
        <div className="flex items-center gap-2">
          <p className="hidden text-xs text-muted sm:block">{user?.email}</p>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid flex-1 gap-6 md:grid-cols-[240px_1fr]">
        <aside className="surface-panel h-fit p-4 md:sticky md:top-6">
          <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t("onboarding.steps")}
          </p>
          <StepRail
            progress={progress}
            viewStep={pending || rejected ? step : view}
            onSelectStep={pending || rejected ? undefined : selectStep}
          />
        </aside>

        <div className="flex min-h-[28rem] flex-col">
          <div className="surface-panel flex-1 p-6 md:p-8">
            <p className="section-kicker">{t("onboarding.membership")}</p>
            <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {t("onboarding.setupTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted">{t("onboarding.setupBody")}</p>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-sm font-semibold">{t("onboarding.unlockTitle")}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>{t("onboarding.unlock1")}</li>
                <li>{t("onboarding.unlock2")}</li>
                <li>{t("onboarding.unlock3")}</li>
                <li>{t("onboarding.unlock4")}</li>
                <li>{t("onboarding.unlock5")}</li>
              </ul>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
                {error}
              </p>
            ) : null}

            {rejected ? (
              <div className="mt-6 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/5 p-5">
                <p className="font-medium text-[var(--danger)]">{t("onboarding.rejectedTitle")}</p>
                <p className="mt-2 text-sm text-muted">
                  {progress.latest_verification?.rejection_reason || t("onboarding.rejectedFallback")}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  className="btn-primary mt-4"
                  onClick={() =>
                    void (async () => {
                      setBusy(true);
                      try {
                        await resubmitVerification();
                        await load();
                      } catch {
                        setError(t("onboarding.resubmitFailed"));
                      } finally {
                        setBusy(false);
                      }
                    })()
                  }
                >
                  {t("onboarding.resubmitStep3")}
                </button>
                <Link href={supportHref} className="btn-ghost mt-3 ml-3 inline-flex">
                  {t("onboarding.supportLink")}
                </Link>
              </div>
            ) : null}

            <div className={`mt-6 ${busy ? "pointer-events-none opacity-60" : ""}`}>
              {!rejected && !pending && view === 1 && (
                <StepBody title={t("onboarding.step1Title")}>
                  <p className="mb-4 text-sm text-muted">{t("onboarding.watchThenContinue")}</p>
                  {progress.settings.broker_tutorial ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
                      <LandingHookVideoPlayer
                        video={progress.settings.broker_tutorial}
                        fallbackTitle={t("onboarding.step1Title")}
                        autoPlay={false}
                        loop={false}
                      />
                    </div>
                  ) : (
                    <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-3 text-sm text-muted">
                      {t("onboarding.videoUnavailable")}
                    </p>
                  )}
                  {reviewingPast ? (
                    <button type="button" className="btn-primary" onClick={goNext}>
                      {t("onboarding.nextStep")}
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => void run(completeStep1)}>
                      {t("onboarding.markWatched")}
                    </button>
                  )}
                  <StepNav canGoBack={canGoBack} onBack={goBack} backLabel={t("onboarding.backStep")} />
                </StepBody>
              )}

              {!rejected && !pending && view === 2 && (
                <StepBody title={t("onboarding.step2Title")}>
                  <p className="mb-4 text-sm text-muted">{t("onboarding.step2Body")}</p>
                  {reviewingPast ? (
                    <button type="button" className="btn-primary" onClick={goNext}>
                      {t("onboarding.nextStep")}
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={() => void run(completeStep2)}>
                      {t("onboarding.iveRegistered")}
                    </button>
                  )}
                  <StepNav canGoBack={canGoBack} onBack={goBack} backLabel={t("onboarding.backStep")} />
                </StepBody>
              )}

              {!rejected && !pending && view === 3 && (
                <StepBody title={t("onboarding.step3Title")}>
                  <div className="mt-4 max-w-md space-y-3">
                    <label className="block space-y-1.5 text-sm">
                      <span className="text-muted">{t("onboarding.mt5Account")}</span>
                      <input
                        className="field-input"
                        value={mt5}
                        onChange={(e) => setMt5(e.target.value)}
                        disabled={reviewingPast}
                      />
                    </label>
                    <label className="block space-y-1.5 text-sm">
                      <span className="text-muted">{t("onboarding.brokerServer")}</span>
                      <input
                        className="field-input"
                        value={server}
                        onChange={(e) => setServer(e.target.value)}
                        disabled={reviewingPast}
                      />
                    </label>
                    {reviewingPast ? (
                      <button type="button" className="btn-primary" onClick={goNext}>
                        {t("onboarding.nextStep")}
                      </button>
                    ) : (
                      <button type="button" className="btn-primary" onClick={submitMt5}>
                        {t("onboarding.saveContinue")}
                      </button>
                    )}
                  </div>
                  <StepNav canGoBack={canGoBack} onBack={goBack} backLabel={t("onboarding.backStep")} />
                </StepBody>
              )}

              {!rejected && !pending && view === 4 && (
                <StepBody title={t("onboarding.step4Title")}>
                  <p className="mb-4 text-sm text-muted">{t("onboarding.watchThenContinue")}</p>
                  {progress.settings.deposit_tutorial ? (
                    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--border)]">
                      <LandingHookVideoPlayer
                        video={progress.settings.deposit_tutorial}
                        fallbackTitle={t("onboarding.step4Title")}
                        autoPlay={false}
                        loop={false}
                      />
                    </div>
                  ) : (
                    <p className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 px-3 py-3 text-sm text-muted">
                      {t("onboarding.videoUnavailable")}
                    </p>
                  )}
                  <div className="mt-4 max-w-md space-y-3">
                    {!reviewingPast ? (
                      <label className="block space-y-1.5 text-sm">
                        <span className="text-muted">
                          {t("onboarding.proofRequiredLabel")} <span className="text-[var(--danger)]">*</span>
                        </span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          required
                          onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                        />
                        <span className="block text-xs text-muted">{t("onboarding.proofRequiredHint")}</span>
                      </label>
                    ) : null}
                    {reviewingPast ? (
                      <button type="button" className="btn-primary" onClick={goNext}>
                        {t("onboarding.nextStep")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          if (!proofFile) {
                            setError(t("onboarding.proofRequired"));
                            return;
                          }
                          void run(async () => {
                            const up = await uploadProof(proofFile);
                            if (!up.success || !up.data) throw new Error("upload failed");
                            return completeStep4({ proof_key: up.data.key });
                          });
                        }}
                      >
                        {t("onboarding.continue")}
                      </button>
                    )}
                  </div>
                  <StepNav canGoBack={canGoBack} onBack={goBack} backLabel={t("onboarding.backStep")} />
                </StepBody>
              )}

              {!rejected && !pending && view === 5 && (
                <StepBody title={t("onboarding.step5Title")}>
                  <p className="text-sm text-muted">{t("onboarding.step5Body")}</p>
                  <button type="button" className="btn-primary mt-4" onClick={() => void run(completeStep5)}>
                    {t("onboarding.submitVerification")}
                  </button>
                  <StepNav canGoBack={canGoBack} onBack={goBack} backLabel={t("onboarding.backStep")} />
                </StepBody>
              )}

              {pending ? (
                <StepBody title={t("onboarding.waitingTitle")}>
                  <p className="text-sm text-muted">
                    MT5 {progress.latest_verification?.mt5_account} · {progress.latest_verification?.broker_server}
                  </p>
                  <WaitingTimeline
                    submitted
                    pending
                    rejected={false}
                    verified={false}
                  />
                  <Link href={ROUTES.member} className="btn-ghost mt-6 inline-flex">
                    {t("onboarding.previewDesk")}
                  </Link>
                </StepBody>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepNav({
  canGoBack,
  onBack,
  backLabel,
}: {
  canGoBack: boolean;
  onBack: () => void;
  backLabel: string;
}) {
  if (!canGoBack) return null;
  return (
    <div className="mt-6 border-t border-[var(--border)] pt-4">
      <button type="button" className="btn-ghost" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

function StepBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
