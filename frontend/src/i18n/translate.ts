import { en, type Messages } from "@/i18n/messages/en";
import { id } from "@/i18n/messages/id";
import type { Locale } from "@/i18n/config";

export const catalogs: Record<Locale, Messages> = { id, en };

type Dict = Record<string, unknown>;

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Dict)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const raw = getByPath(catalogs[locale], key) ?? getByPath(en, key) ?? key;
  if (!params) return raw;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    raw,
  );
}

export function translateStatus(locale: Locale, status: string): string {
  const key = `status.${status.toLowerCase()}`;
  const translated = getByPath(catalogs[locale], key) ?? getByPath(en, key);
  if (translated) return translated;
  return status.replaceAll("_", " ");
}

export function translateRelative(locale: Locale, iso?: string | null): string {
  if (!iso) return "—";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "—";
  const diff = Date.now() - time;
  const m = Math.floor(diff / 60000);
  if (m < 1) return translate(locale, "common.justNow");
  if (m < 60) return translate(locale, "common.minutesAgo", { n: m });
  const h = Math.floor(m / 60);
  if (h < 48) return translate(locale, "common.hoursAgo", { n: h });
  const d = Math.floor(h / 24);
  return translate(locale, "common.daysAgo", { n: d });
}
