"use client";

import Link from "next/link";
import { Lock, Play, FileText } from "lucide-react";
import type { ContentItem } from "@/services/content";
import { mediaCoverStyle } from "@/lib/media-cover";
import { useAuthStore } from "@/store/auth";
import { membershipCta } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export function ContentCard({ item, hrefBase }: { item: ContentItem; hrefBase: string }) {
  const { t } = useT();
  return (
    <Link
      href={`${hrefBase}/${item.slug}`}
      className="group overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--card)] transition hover:border-accent/40"
    >
      <div
        className="relative flex h-36 items-end p-4"
        style={mediaCoverStyle(item.slug, item.thumbnail_url)}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
          {item.type === "video" ? <Play className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
          {item.type}
        </span>
        {item.locked ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[10px] uppercase tracking-wide text-white">
            <Lock className="h-3 w-3" /> {t("member.locked")}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{item.category_name || item.module}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug group-hover:text-accent">{item.title}</h3>
        {item.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.excerpt}</p> : null}
      </div>
    </Link>
  );
}

export function LockedNotice() {
  const { t } = useT();
  const status = useAuthStore((s) => s.user?.status);
  const cta = membershipCta(status);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent-soft/50 p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_100%_0%,var(--glow),transparent_60%)]" />
      <div className="relative">
        <p className="font-display text-lg font-semibold text-accent">{t("member.premiumLocked")}</p>
        <p className="mt-1.5 text-sm text-muted">{t("member.premiumLockedBody")}</p>
        <Link href={cta.href} className="btn-primary mt-4 inline-flex">
          {t(cta.labelKey)}
        </Link>
      </div>
    </div>
  );
}
