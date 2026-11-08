"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addBookmark,
  getContent,
  removeBookmark,
  saveHistory,
  type ContentItem,
} from "@/services/content";
import { LockedNotice } from "@/components/member/ContentCard";
import { ContentHtml } from "@/components/content/ContentHtml";
import { ContentPdfViewer } from "@/components/content/ContentPdfViewer";
import { ContentVideoPlayer } from "@/components/content/ContentVideoPlayer";
import { useAuthStore } from "@/store/auth";
import { membershipCta, isVerifiedMember } from "@/lib/membership";
import { useT } from "@/i18n/useT";

export function ContentDetail({ slug, backHref }: { slug: string; backHref: string }) {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const verified = isVerifiedMember(user);
  const cta = membershipCta(user?.status);
  const [item, setItem] = useState<ContentItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getContent(slug);
        if (res.success && res.data) {
          setItem(res.data);
          if (!res.data.locked && verified) {
            void saveHistory(res.data.id, { progress_pct: 5, last_position_sec: 0, completed: false });
          }
        } else setError(res.message);
      } catch {
        setError("Failed to load content");
      }
    })();
  }, [slug, verified]);

  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>;
  if (!item) {
    return (
      <div className="space-y-4">
        <div className="skeleton-shimmer h-4 w-24 rounded" />
        <div className="skeleton-shimmer h-10 w-2/3 rounded-xl" />
        <div className="skeleton-shimmer h-64 w-full rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex text-sm text-muted transition hover:text-accent">
        {t("common.back")}
      </Link>
      <div className="border-b border-[var(--border)] pb-5">
        <p className="section-kicker">{item.type}</p>
        <h1 className="font-display mt-1.5 text-3xl font-semibold tracking-tight md:text-[2.35rem]">{item.title}</h1>
        {item.excerpt ? <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted md:text-base">{item.excerpt}</p> : null}
      </div>

      {item.locked ? (
        <LockedNotice />
      ) : (
        <>
          {item.type === "video" ? <ContentVideoPlayer url={item.video_url} /> : null}
          {item.file_url ? <ContentPdfViewer url={item.file_url} title={item.title} /> : null}
          {item.body ? <ContentHtml html={item.body} /> : null}
          {verified ? (
            <button
              type="button"
              disabled={busy}
              className="btn-ghost"
              onClick={() =>
                void (async () => {
                  setBusy(true);
                  try {
                    if (item.bookmarked) await removeBookmark(item.id);
                    else await addBookmark(item.id);
                    setItem({ ...item, bookmarked: !item.bookmarked });
                  } finally {
                    setBusy(false);
                  }
                })()
              }
            >
              {item.bookmarked ? t("common.removeBookmark") : t("common.bookmark")}
            </button>
          ) : (
            <Link href={cta.href} className="text-sm font-medium text-accent hover:underline">
              {t("member.bookmarkTo", { cta: t(cta.labelKey) })}
            </Link>
          )}
        </>
      )}
    </div>
  );
}
