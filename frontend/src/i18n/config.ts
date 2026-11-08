export type Locale = "id" | "en";

export const LOCALES: { value: Locale; label: string; short: string }[] = [
  { value: "id", label: "Bahasa Indonesia", short: "ID" },
  { value: "en", label: "English", short: "EN" },
];

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_STORAGE_KEY = "ib_locale";
