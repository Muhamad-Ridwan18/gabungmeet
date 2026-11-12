import { xauusdEducation } from "@/content/xauusd-education";
import type {
  LandingContent,
  LandingLocale,
  LandingSection,
  LandingSectionKind,
  LandingSectionText,
} from "@/services/landing";

/**
 * Fallback content for the landing page. Used when the admin has not saved anything yet
 * (or the API is unreachable), and as the starting point inside the admin editor.
 */

const LOCALES: LandingLocale[] = ["id", "en"];

const emptyText: LandingSectionText = { kicker: "", title: "", body: "", col_a: "", col_b: "", items: [] };

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paragraphs(list: string[]) {
  return list.map((p) => `<p>${esc(p)}</p>`).join("");
}

function section(
  key: string,
  kind: LandingSectionKind,
  enabled: boolean,
  build: (locale: LandingLocale) => Partial<LandingSectionText>,
): LandingSection {
  return {
    key,
    kind,
    enabled,
    i18n: {
      id: { ...emptyText, ...build("id") },
      en: { ...emptyText, ...build("en") },
    },
  };
}

function buildSections(): LandingSection[] {
  const x = (l: LandingLocale) => xauusdEducation[l];

  return [
    section("headline", "text", true, (l) => ({
      kicker: x(l).kicker,
      title: x(l).title,
      body: paragraphs([x(l).subtitle]),
    })),
    section("intro", "text", false, (l) => ({
      kicker: x(l).intro.kicker,
      body: paragraphs(x(l).intro.paragraphs),
    })),
    section("what-is", "cards", true, (l) => ({
      kicker: x(l).whatIs.kicker,
      title: x(l).whatIs.title,
      body: paragraphs(x(l).whatIs.paragraphs),
      items: [
        { title: x(l).whatIs.buyLabel, body: x(l).whatIs.buyText },
        { title: x(l).whatIs.sellLabel, body: x(l).whatIs.sellText },
        { title: x(l).whatIs.noteLabel, body: x(l).whatIs.noteText },
      ],
    })),
    section("compare", "compare", true, (l) => ({
      kicker: x(l).compare.kicker,
      title: x(l).compare.title,
      col_a: x(l).compare.colTrading,
      col_b: x(l).compare.colGambling,
      items: x(l).compare.rows.map((row) => ({ title: row.trading, body: row.gambling })),
    })),
    section("binary", "text", false, (l) => ({
      kicker: x(l).binary.kicker,
      title: x(l).binary.title,
      body:
        paragraphs(x(l).binary.paragraphs) +
        `<blockquote><p>${esc(x(l).binary.flow)}</p></blockquote>` +
        paragraphs([x(l).binary.closing]),
    })),
    section("mindset", "cards", false, (l) => ({
      kicker: x(l).mindset.kicker,
      title: x(l).mindset.title,
      body: paragraphs(x(l).mindset.paragraphs),
      items: [{ title: x(l).mindset.paramsLabel, body: x(l).mindset.paramsText }],
    })),
    section("process", "steps", true, (l) => ({
      kicker: x(l).process.kicker,
      title: x(l).process.title,
      items: x(l).process.steps.map((s) => ({ title: s.title, body: s.body })),
    })),
    section("curriculum", "cards", true, (l) => ({
      kicker: x(l).curriculum.kicker,
      title: x(l).curriculum.title,
      items: x(l).curriculum.items.map((i) => ({ title: i.title, body: i.body })),
    })),
    section("closing", "text", true, (l) => ({
      title: x(l).closing.title,
      body: paragraphs([x(l).closing.body]),
    })),
  ];
}

export function buildDefaultLandingContent(): LandingContent {
  const disclaimer = (l: LandingLocale) => ({
    label: xauusdEducation[l].closing.disclaimerLabel,
    body: xauusdEducation[l].closing.disclaimerBody,
  });

  return {
    hero: {
      id: {
        badge: "#1 Community Trading",
        title_a: "Gabung",
        title_b: "Meet",
        subtitle: "Copy Trade · Safe · Steady Growth",
        body: "Komunitas trading dengan edukasi, analisis pasar, dan sinyal yang membantu Anda tumbuh lebih terarah.",
        cta: "Daftar Gratis",
      },
      en: {
        badge: "#1 Community Trading",
        title_a: "Gabung",
        title_b: "Meet",
        subtitle: "Copy Trade · Safe · Steady Growth",
        body: "A trading community with education, market analysis, and signals that help you grow with clearer direction.",
        cta: "Register Free",
      },
    },
    sections: buildSections(),
    cta: {
      id: {
        title: "Siap mulai perjalanan trading Anda?",
        body: "Daftar gratis, pelajari materi edukasi, lalu selesaikan verifikasi saat siap membuka fitur premium.",
        button: "Daftar Sekarang",
        login: "Masuk Member",
      },
      en: {
        title: "Ready to start your trading journey?",
        body: "Register free, study the education material, then complete verification when you're ready for premium access.",
        button: "Register Now",
        login: "Member Login",
      },
    },
    disclaimer: { id: disclaimer("id"), en: disclaimer("en") },
  };
}

export const defaultLandingContent: LandingContent = buildDefaultLandingContent();

export { LOCALES as LANDING_LOCALES };
