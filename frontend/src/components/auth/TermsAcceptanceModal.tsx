"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TermsContent } from "@/components/legal/TermsContent";
import { termsAndConditions } from "@/content/terms-and-conditions";
import { useT } from "@/i18n/useT";

type TermsAcceptanceModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
};

export function TermsAcceptanceModal({ open, onClose, onConfirm, busy = false }: TermsAcceptanceModalProps) {
  const { locale, t } = useT();
  const c = termsAndConditions[locale === "id" ? "id" : "en"];
  const [terms, setTerms] = useState({ docs: false, age: false, risk: false });
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTerms({ docs: false, age: false, risk: false });
    setShowError(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, busy]);

  if (!open) return null;

  const fields = [
    { key: "docs" as const, label: c.declarations[0] },
    { key: "age" as const, label: c.declarations[1] },
    { key: "risk" as const, label: c.declarations[2] },
  ];

  const allAccepted = terms.docs && terms.age && terms.risk;

  const handleConfirm = () => {
    if (!allAccepted) {
      setShowError(true);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label={t("common.close")}
        disabled={busy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("auth.termsTitle")}</p>
            <h2 id="terms-modal-title" className="font-display mt-1 text-lg font-semibold tracking-tight">
              {c.pageTitle}
            </h2>
            <p className="mt-1 text-xs text-muted">{t("auth.termsModalHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-muted hover:bg-accent-soft hover:text-accent disabled:opacity-50"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <TermsContent compact />
        </div>

        <div className="shrink-0 space-y-3 border-t border-[var(--border)] bg-[var(--surface-2)]/40 px-5 py-4">
          <div className="space-y-2.5">
            {fields.map((field) => (
              <label key={field.key} className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--accent)]"
                  checked={terms[field.key]}
                  disabled={busy}
                  onChange={(e) => {
                    setTerms((prev) => ({ ...prev, [field.key]: e.target.checked }));
                    setShowError(false);
                  }}
                />
                <span className="leading-relaxed text-muted">{field.label}</span>
              </label>
            ))}
          </div>

          {showError ? <p className="text-xs text-[var(--danger)]">{c.checkboxRequired}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full py-2.5 sm:w-auto sm:px-5" disabled={busy} onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="btn-primary w-full py-2.5 sm:w-auto sm:px-5 disabled:opacity-50"
              disabled={busy}
              onClick={handleConfirm}
            >
              {busy ? t("auth.creating") : t("auth.termsAgreeRegister")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
