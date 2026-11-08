export type CompoundingCurrency = "USD" | "EUR" | "IDR";

export const COMPOUNDING_CURRENCIES: CompoundingCurrency[] = ["USD", "EUR", "IDR"];

export type ExchangeRateMap = Record<CompoundingCurrency, number>;

export function convertAmount(
  amount: number,
  from: CompoundingCurrency,
  to: CompoundingCurrency,
  rates: ExchangeRateMap,
): number {
  if (from === to) return amount;
  const usd = amount / rates[from];
  return usd * rates[to];
}

export function formatCurrency(value: number, currency: CompoundingCurrency, locale?: string): string {
  const resolvedLocale =
    locale ?? (currency === "IDR" ? "id-ID" : currency === "EUR" ? "de-DE" : "en-US");
  return value.toLocaleString(resolvedLocale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
  });
}
