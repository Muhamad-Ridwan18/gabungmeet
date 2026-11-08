"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminCreateBonus,
  adminDeleteBonus,
  adminListBonuses,
  adminUpdateBonus,
  type BonusItem,
} from "@/services/bonus";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  AdminEmpty,
  AdminFilterSeg,
  AdminPageHeader,
} from "@/components/admin/AdminChrome";
import { useT } from "@/i18n/useT";

export default function AdminBonusesPage() {
  const { t, ts } = useT();
  const FILTERS = [
    { value: "", label: t("common.all") },
    { value: "active", label: t("status.active") },
    { value: "inactive", label: t("status.inactive") },
  ];
  const [items, setItems] = useState<BonusItem[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminListBonuses();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || t("admin.loadFailed"));
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (filter === "active") return items.filter((b) => b.is_active);
    if (filter === "inactive") return items.filter((b) => !b.is_active);
    return items;
  }, [items, filter]);

  return (
    <div>
      <AdminPageHeader
        title={t("admin.bonusesTitle")}
        description={loading ? t("common.loading") : t("admin.resourcesCount", { n: filtered.length })}
        actions={<AdminFilterSeg value={filter} options={FILTERS} onChange={setFilter} />}
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("admin.newBonus")}</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.bonusTitleField")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="field-input min-h-[88px] text-sm"
                placeholder={t("admin.description")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.externalUrl")}
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm"
                disabled={busy}
                onClick={() =>
                  void (async () => {
                    if (!title.trim()) {
                      setError(t("admin.titleRequired"));
                      return;
                    }
                    setBusy(true);
                    setError(null);
                    try {
                      await adminCreateBonus({
                        title,
                        description: description || null,
                        external_url: externalUrl || null,
                        is_active: true,
                        sort_order: items.length,
                      });
                      setTitle("");
                      setDescription("");
                      setExternalUrl("");
                      await load();
                    } catch {
                      setError(t("admin.createFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {t("admin.create")}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="hidden grid-cols-[1.5fr_1fr_auto_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span>{t("admin.bonusTitleField")}</span>
            <span>{t("admin.link")}</span>
            <span>{t("common.status")}</span>
            <span className="text-right">{t("common.actions")}</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <AdminEmpty
              title={t("admin.noBonuses")}
              description={filter ? t("admin.noResourcesForFilter", { filter: ts(filter) }) : t("admin.addResourceHint")}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {filtered.map((b) => (
                <li
                  key={b.id}
                  className="grid gap-2 px-4 py-3 transition hover:bg-[var(--surface-2)] md:grid-cols-[1.5fr_1fr_auto_auto] md:items-center md:gap-3 md:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{b.title}</p>
                    {b.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{b.description}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    {b.external_url ? (
                      <a
                        href={b.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm text-accent hover:underline"
                      >
                        {b.external_url.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-sm text-muted">—</span>
                    )}
                  </div>
                  <StatusBadge
                    label={b.is_active ? "active" : "inactive"}
                    tone={b.is_active ? "accent" : "muted"}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                    <button
                      type="button"
                      className="font-medium text-accent hover:underline"
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminUpdateBonus(b.id, {
                              title: b.title,
                              description: b.description,
                              external_url: b.external_url,
                              is_active: !b.is_active,
                              sort_order: b.sort_order,
                            });
                            await load();
                          } catch {
                            setError(t("admin.updateFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {b.is_active ? t("admin.deactivate") : t("admin.activate")}
                    </button>
                    <button
                      type="button"
                      className="font-medium text-[var(--danger)] hover:underline"
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminDeleteBonus(b.id);
                            await load();
                          } catch {
                            setError(t("admin.deleteFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
