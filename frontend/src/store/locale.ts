"use client";

import { create } from "zustand";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";

type LocaleState = {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  hydrate: () => void;
};

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  hydrated: false,
  setLocale: (locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    applyLocale(locale);
    set({ locale });
  },
  toggleLocale: () => {
    const next = get().locale === "id" ? "en" : "id";
    get().setLocale(next);
  },
  hydrate: () => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale: Locale = stored === "en" || stored === "id" ? stored : DEFAULT_LOCALE;
    applyLocale(locale);
    set({ locale, hydrated: true });
  },
}));
