"use client";

import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import type { ContentItem } from "@/services/content";
import { articleCoverStyle, mediaCoverStyle } from "@/lib/media-cover";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

export function ContentRail({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useT();
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
        {href ? (
          <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-accent">
            {t("common.seeAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function MediaCard({
  item,
  hrefBase,
  large,
  progress,
}: {
  item: ContentItem;
  hrefBase: string;
  large?: boolean;
  progress?: number;
}) {
  const { t } = useT();
  const bar = progress != null ? Math.min(100, Math.max(8, progress)) : large ? 33 : 0;

  return (
    <Link
      href={`${hrefBase}/${item.slug}`}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-2xl bg-[#0b1220] text-white shadow-[var(--shadow)] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        large ? "h-48 w-72 sm:h-52 sm:w-80" : "h-40 w-56 sm:h-44 sm:w-64",
      )}
    >
      <div className="absolute inset-0" style={mediaCoverStyle(item.slug, item.thumbnail_url)} />
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        {item.type === "video" ? (
          <span className="mb-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur transition group-hover:bg-accent">
            <Play className="h-4 w-4 fill-current" />
          </span>
        ) : (
          <span className="mb-auto" />
        )}
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/70">
          {item.type}
          {item.locked ? ` · ${t("member.locked")}` : ""}
          {item.duration_sec ? ` · ${Math.ceil(item.duration_sec / 60)}m` : ""}
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
        {large || bar > 0 ? (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${bar}%` }} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function ArticleCard({ item, hrefBase }: { item: ContentItem; hrefBase: string }) {
  const { t } = useT();
  return (
    <Link
      href={`${hrefBase}/${item.slug}`}
      className="surface-panel group flex w-72 shrink-0 flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-accent/30"
    >
      <div className="h-32 dark:opacity-90" style={articleCoverStyle(item.slug, item.thumbnail_url)} />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          {item.category_name || t("member.article")}
        </p>
        <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold group-hover:text-accent">
          {item.title}
        </h3>
        {item.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.excerpt}</p> : null}
      </div>
    </Link>
  );
}
