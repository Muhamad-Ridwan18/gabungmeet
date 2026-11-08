"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { acceptRiskDisclosure, hasAcceptedRiskDisclosure } from "@/lib/risk-disclosure";
import { track } from "@/lib/analytics";
import { useT } from "@/i18n/useT";

export function RiskDisclosureGate({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const ok = hasAcceptedRiskDisclosure();
    setAccepted(ok);
    setReady(true);
  }, []);

  const onAccept = () => {
    if (!checked) return;
    acceptRiskDisclosure();
    track("risk_accepted");
    setAccepted(true);
  };

  if (!ready) return null;
  if (accepted) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="section-kicker">{t("risk.kicker")}</p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{t("risk.title")}</h2>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
          <p>{t("risk.p1")}</p>
          <p>{t("risk.p2")}</p>
          <p>{t("risk.p3")}</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>{t("risk.b1")}</li>
            <li>{t("risk.b2")}</li>
            <li>{t("risk.b3")}</li>
            <li>{t("risk.b4")}</li>
          </ul>
          <p className="text-xs">{t("risk.footer")}</p>
        </div>
        <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 accent-[var(--accent)]"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>{t("risk.checkbox")}</span>
        </label>
        <button
          type="button"
          disabled={!checked}
          className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onAccept}
        >
          {t("risk.accept")}
        </button>
      </div>
    </div>
  );
}
