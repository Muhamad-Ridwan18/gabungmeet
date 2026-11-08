"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/store/locale";
import { translate, translateRelative, translateStatus } from "@/i18n/translate";

export function useT() {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const ts = useCallback((status: string) => translateStatus(locale, status), [locale]);

  const tr = useCallback((iso?: string | null) => translateRelative(locale, iso), [locale]);

  return { t, ts, tr, locale };
}
