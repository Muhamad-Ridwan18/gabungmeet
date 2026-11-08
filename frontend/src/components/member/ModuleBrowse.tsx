"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Play } from "lucide-react";
import {
  addBookmark,
  listCategories,
  listContents,
  removeBookmark,
  type Category,
  type ContentItem,
  type ContentModule,
} from "@/services/content";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MemberFilterSeg, MemberList, MemberListRow } from "@/components/member/MemberChrome";
import { mediaCoverStyle } from "@/lib/media-cover";
import { membershipCta } from "@/lib/membership";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";
import Link from "next/link";

const MODULE_TITLE_KEYS: Partial<Record<ContentModule, string>> = {
  academy: "nav.academy",
  tutorial: "member.tutorial",
  psychology: "member.psychology",
  money_management: "member.moneyManagement",
  daily_analysis: "member.technical",
};

const MODULE_DESC_KEYS: Partial<Record<ContentModule, string>> = {
  tutorial: "member.tutorialBrowseDesc",
  psychology: "member.psychologyBrowseDesc",
  money_management: "member.moneyManagementBrowseDesc",
  daily_analysis: "member.technicalBrowseDesc",
};

const MODULE_EMPTY_KEYS: Partial<Record<ContentModule, string>> = {
  tutorial: "member.tutorialEmptyBody",
  psychology: "member.psychologyEmptyBody",
  money_management: "member.moneyManagementEmptyBody",
  daily_analysis: "member.technicalEmptyBody",
};

/** Modules readable without MT5 verification. */
const OPEN_MODULES: ContentModule[] = ["tutorial"];

export function ModuleBrowse({ module, hrefBase }: { module: ContentModule; hrefBase: string }) {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const isVerified = user?.status === "verified" || user?.role === "admin" || user?.role === "super_admin";
  const verified = isVerified || OPEN_MODULES.includes(module);
  const cta = membershipCta(user?.status);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [cRes, tRes] = await Promise.all([
          listCategories(module),
          listContents({
            module,
            q: q || undefined,
            type: type || undefined,
            category_id: categoryId || undefined,
          }),
        ]);
        if (!alive) return;
        if (cRes.success && cRes.data) setCategories(cRes.data);
        if (tRes.success && tRes.data) setItems(tRes.data);
        else setError(tRes.message);
      } catch {
        if (alive) setError("Failed to load content");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [module, q, type, categoryId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) map[c.id] = 0;
    for (const item of items) {
      if (item.category_id) map[item.category_id] = (map[item.category_id] || 0) + 1;
    }
    return map;
  }, [categories, items]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={verified ? t("member.unlocked") : t("member.preview")}
        title={t(MODULE_TITLE_KEYS[module] ?? "member.education")}
        description={
          verified ? t(MODULE_DESC_KEYS[module] ?? "member.browseVerified") : t("member.browseLocked")
        }
        actions={
          <MemberFilterSeg
            value={type}
            onChange={setType}
            options={[
              { value: "", label: t("common.all") },
              { value: "video", label: t("member.video") },
              { value: "article", label: t("member.article") },
            ]}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="field-input max-w-md"
          placeholder={t("member.searchLessons")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2">
          <p className="px-2.5 pb-2 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Categories
          </p>
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={cn(
              "mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
              !categoryId ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-[var(--surface-2)]",
            )}
          >
            <span>All</span>
            <span className="text-xs tabular-nums">{items.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={cn(
                "mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                categoryId === c.id
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-[var(--surface-2)]",
              )}
            >
              <span className="truncate">{c.name}</span>
              <span className="text-xs tabular-nums">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </aside>

        <div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : null}
          {!loading && items.length === 0 ? (
            <EmptyState
              title={t("member.noContentTitle")}
              description={t(MODULE_EMPTY_KEYS[module] ?? "member.noContentBody")}
              actionLabel={verified ? undefined : t(cta.labelKey)}
              actionHref={verified ? undefined : cta.href}
            />
          ) : null}
          {!loading && items.length > 0 ? (
            <MemberList>
              {items.map((item) => (
                <MemberListRow key={item.id} className="!p-3 sm:!px-4 sm:!py-3.5">
                  <div className="flex gap-3 sm:gap-4">
                    <Link
                      href={`${hrefBase}/${item.slug}`}
                      className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36"
                      style={mediaCoverStyle(item.slug, item.thumbnail_url)}
                    >
                      {item.type === "video" ? (
                        <span className="absolute inset-0 flex items-center justify-center text-white/90">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                      ) : null}
                      {item.duration_sec ? (
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                          {Math.ceil(item.duration_sec / 60)}m
                        </span>
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-muted">
                            {item.category_name || item.type}
                            {item.locked ? ` · ${t("member.locked")}` : ""}
                          </p>
                          <Link
                            href={`${hrefBase}/${item.slug}`}
                            className="mt-0.5 block truncate font-display text-base font-semibold hover:text-accent sm:text-lg"
                          >
                            {item.title}
                          </Link>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-accent-soft hover:text-accent"
                          aria-label="Bookmark"
                          onClick={() =>
                            void (async () => {
                              if (item.bookmarked) await removeBookmark(item.id);
                              else await addBookmark(item.id);
                              setItems((prev) =>
                                prev.map((x) => (x.id === item.id ? { ...x, bookmarked: !x.bookmarked } : x)),
                              );
                            })()
                          }
                        >
                          <Bookmark className={`h-4 w-4 ${item.bookmarked ? "fill-accent text-accent" : ""}`} />
                        </button>
                      </div>
                      {item.excerpt ? <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.excerpt}</p> : null}
                    </div>
                  </div>
                </MemberListRow>
              ))}
            </MemberList>
          ) : null}
        </div>
      </div>
    </div>
  );
}
