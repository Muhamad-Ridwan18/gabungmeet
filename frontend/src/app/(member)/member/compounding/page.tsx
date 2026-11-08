"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { LockedModule } from "@/components/member/LockedModule";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import {
  COMPOUNDING_CURRENCIES,
  convertAmount,
  formatCurrency,
  type CompoundingCurrency,
} from "@/lib/currency";
import { cn } from "@/lib/utils";

function formatUpdatedAt(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CompoundingCalculatorPage() {
  const { t, locale } = useT();
  const user = useAuthStore((s) => s.user);
  const unlocked = isVerifiedMember(user);
  const { rates, updatedAt, loading, error, refresh } = useExchangeRates();
  const [currency, setCurrency] = useState<CompoundingCurrency>("USD");
  const [initial, setInitial] = useState("1000");
  const [dailyPct, setDailyPct] = useState("0.5");
  const [days, setDays] = useState("30");
  const [dailyDeposit, setDailyDeposit] = useState("0");

  const result = useMemo(() => {
    const start = Number(initial) || 0;
    const rate = (Number(dailyPct) || 0) / 100;
    const period = Math.max(0, Math.floor(Number(days) || 0));
    const deposit = Number(dailyDeposit) || 0;
    let balance = start;
    const rows: { day: number; balance: number; gain: number }[] = [];

    for (let d = 1; d <= period; d += 1) {
      const before = balance + deposit;
      balance = before * (1 + rate);
      rows.push({ day: d, balance, gain: balance - before });
    }

    return {
      final: balance,
      profit: balance - start - deposit * period,
      rows,
    };
  }, [initial, dailyPct, days, dailyDeposit]);

  function switchCurrency(next: CompoundingCurrency) {
    if (next === currency) return;
    if (rates) {
      const convert = (value: string) => {
        const amount = Number(value) || 0;
        return String(convertAmount(amount, currency, next, rates));
      };
      setInitial(convert(initial));
      setDailyDeposit(convert(dailyDeposit));
    }
    setCurrency(next);
  }

  function format(value: number) {
    return formatCurrency(value, currency, locale);
  }

  const otherCurrencies = COMPOUNDING_CURRENCIES.filter((code) => code !== currency);
  const updatedLabel = formatUpdatedAt(updatedAt, locale);
  const rateLine =
    rates &&
    t("member.compoundingRateLine", {
      eur: formatCurrency(rates.EUR, "EUR", locale),
      idr: formatCurrency(rates.IDR, "IDR", locale),
    });

  if (!unlocked) return <LockedModule title={t("member.compounding")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("member.toolsKicker")}
        title={t("member.compounding")}
        description={t("member.compoundingDesc")}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{t("member.compoundingCurrency")}</p>
              <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-1">
                {COMPOUNDING_CURRENCIES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    disabled={!rates && !loading}
                    onClick={() => switchCurrency(code)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      currency === code
                        ? "bg-accent text-[var(--btn-fg)] shadow-sm"
                        : "text-muted hover:text-[var(--foreground)]",
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 px-3 py-2 text-xs text-muted">
              <div className="min-w-0">
                {loading ? (
                  <span>{t("member.compoundingRatesLoading")}</span>
                ) : error ? (
                  <span className="text-amber-600 dark:text-amber-400">{t("member.compoundingRatesError")}</span>
                ) : (
                  <span>
                    <span className="font-medium text-[var(--foreground)]">{t("member.compoundingRatesLive")}</span>
                    {rateLine ? <span className="ml-2">{rateLine}</span> : null}
                    {updatedLabel ? (
                      <span className="ml-2">
                        · {t("member.compoundingRatesUpdated", { time: updatedLabel })}
                      </span>
                    ) : null}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-muted transition hover:bg-accent-soft hover:text-accent"
                aria-label={t("member.compoundingRatesRefresh")}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingInitial")}</span>
              <input className="field-input" inputMode="decimal" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDailyDeposit")}</span>
              <input
                className="field-input"
                inputMode="decimal"
                value={dailyDeposit}
                onChange={(e) => setDailyDeposit(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDailyReturn")}</span>
              <input className="field-input" inputMode="decimal" value={dailyPct} onChange={(e) => setDailyPct(e.target.value)} />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-muted">{t("member.compoundingDays")}</span>
              <input className="field-input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{t("member.compoundingFinal")}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{format(result.final)}</p>
              {rates ? (
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {otherCurrencies.map((code) => (
                    <li key={code}>
                      ≈ {formatCurrency(convertAmount(result.final, currency, code, rates), code, locale)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{t("member.compoundingProfit")}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{format(result.profit)}</p>
              {rates ? (
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {otherCurrencies.map((code) => (
                    <li key={code}>
                      ≈ {formatCurrency(convertAmount(result.profit, currency, code, rates), code, locale)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-sm font-medium">{t("member.compoundingProjection")}</p>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-[var(--card)] text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2">{t("member.compoundingDay")}</th>
                  <th className="px-4 py-2">{t("member.compoundingGain")}</th>
                  <th className="px-4 py-2">{t("member.compoundingBalance")}</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.day} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2 tabular-nums">{row.day}</td>
                    <td className="px-4 py-2 tabular-nums">{format(row.gain)}</td>
                    <td className="px-4 py-2 tabular-nums">{format(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
