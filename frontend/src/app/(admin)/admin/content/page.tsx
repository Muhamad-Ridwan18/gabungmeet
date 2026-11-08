"use client";

import { useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminCreateContent,
  adminDeleteCategory,
  adminDeleteContent,
  adminGetContent,
  adminListCategories,
  adminListContents,
  adminPublishContent,
  adminReorderContents,
  adminUpdateContent,
  adminUploadContentPdf,
  adminUploadContentVideo,
  type Category,
  type ContentItem,
  type ContentModule,
  type ContentType,
} from "@/services/content";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminEmpty,
  AdminFilterSeg,
  AdminPageHeader,
} from "@/components/admin/AdminChrome";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, Upload } from "lucide-react";

export default function AdminContentPage() {
  const { t, tr } = useT();
  const MODULES = [
    { value: "tutorial", label: t("member.tutorial") },
    { value: "psychology", label: t("member.psychology") },
    { value: "money_management", label: t("member.moneyManagement") },
    { value: "daily_analysis", label: t("member.technical") },
    { value: "landing", label: t("admin.moduleLanding") },
  ];
  const moduleLabel = (value: string) => MODULES.find((m) => m.value === value)?.label || value;
  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [module, setModule] = useState<ContentModule>("psychology");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [uploadOk, setUploadOk] = useState(false);
  const [pdfUploadOk, setPdfUploadOk] = useState(false);
  const [catName, setCatName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("article");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [premium, setPremium] = useState(true);
  const [publishNow, setPublishNow] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const memberMenuPath =
    module === "tutorial"
      ? "/member/tutorial"
      : module === "psychology"
        ? "/member/psychology"
        : module === "money_management"
          ? "/member/money-management"
          : module === "daily_analysis"
            ? "/member/analysis"
            : null;

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        adminListCategories(module),
        adminListContents({ module }),
      ]);
      if (cRes.success && cRes.data) setCategories(cRes.data);
      if (tRes.success && tRes.data) setContents(tRes.data);
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCategoryId("");
    resetForm();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const resetForm = () => {
    setEditingId(null);
    setEditingSlug(null);
    setTitle("");
    setBody("");
    setVideoUrl("");
    setVideoKey(null);
    setFileUrl("");
    setFileKey(null);
    setUploadOk(false);
    setPdfUploadOk(false);
    setPdfProgress(0);
    setVideoProgress(0);
    setType("article");
    setPremium(true);
    setPublishNow(true);
    setCategoryId("");
  };

  const startEdit = async (id: string) => {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await adminGetContent(id);
      if (!res.success || !res.data) {
        setError(res.message || t("admin.loadFailed"));
        return;
      }
      const item = res.data;
      setEditingId(item.id);
      setEditingSlug(item.slug);
      setTitle(item.title);
      setType(item.type);
      setBody(item.body || "");
      setVideoUrl(item.video_url || "");
      setVideoKey(null);
      setFileUrl(item.file_url || "");
      setFileKey(item.file_key || null);
      setUploadOk(Boolean(item.video_url));
      setPdfUploadOk(Boolean(item.file_url));
      setPremium(item.is_premium);
      setPublishNow(item.status === "published");
      setCategoryId(item.category_id || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const buildPayload = () => ({
    module,
    type,
    title: title.trim(),
    body: body.trim() || null,
    is_premium: module === "tutorial" ? false : premium,
    status: publishNow ? "published" : "draft",
    category_id: categoryId || null,
    excerpt: (body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || title).slice(0, 120),
    ...(editingSlug ? { slug: editingSlug } : {}),
    ...(type === "video"
      ? videoKey
        ? { video_key: videoKey, video_url: videoUrl || null }
        : { video_url: videoUrl.trim() }
      : {
          video_url: null,
          ...(fileKey
            ? { file_key: fileKey, file_url: fileUrl || null }
            : { file_url: fileUrl.trim() || null, file_key: null }),
        }),
  });

  const canSave =
    Boolean(title.trim()) &&
    (type === "article"
      ? Boolean(body.trim() || fileKey || fileUrl.trim())
      : Boolean(videoUrl.trim() || videoKey));

  const moveContent = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= contents.length) return;
    const next = [...contents];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    setContents(next);
    setBusy(true);
    setError(null);
    try {
      await adminReorderContents(
        module,
        next.map((item) => item.id),
      );
    } catch {
      setError(t("admin.reorderFailed"));
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    setVideoProgress(0);
    setUploadOk(false);
    setError(null);
    try {
      const up = await adminUploadContentVideo(file, (percent) => setVideoProgress(percent));
      if (!up.success || !up.data) {
        setError(up.message || t("admin.videoUploadFailed"));
        return;
      }
      setVideoProgress(100);
      setVideoKey(up.data.key);
      setVideoUrl(up.data.url);
      setUploadOk(true);
    } catch {
      setError(t("admin.videoUploadFailed"));
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true);
    setPdfProgress(0);
    setPdfUploadOk(false);
    setError(null);
    try {
      const up = await adminUploadContentPdf(file, (percent) => setPdfProgress(percent));
      if (!up.success || !up.data) {
        setError(up.message || t("admin.pdfUploadFailed"));
        return;
      }
      setPdfProgress(100);
      setFileKey(up.data.key);
      setFileUrl(up.data.url);
      setPdfUploadOk(true);
    } catch {
      setError(t("admin.pdfUploadFailed"));
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={t("admin.contentTitle")}
        description={
          loading
            ? t("common.loading")
            : t("admin.contentDesc")
        }
        actions={<AdminFilterSeg value={module} options={MODULES} onChange={(v) => setModule(v as ContentModule)} />}
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="border-b border-accent/20 bg-accent-soft/40 px-4 py-2 text-sm text-accent md:px-6 lg:px-8">{ok}</p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("admin.categories")}</p>
            <p className="mt-1 text-xs text-muted">{t("admin.contentModuleHint", { module: moduleLabel(module) })}</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.newCategoryPlaceholder")}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary shrink-0 px-3 py-2 text-sm"
                disabled={busy || !catName.trim()}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await adminCreateCategory({ module, name: catName.trim() });
                      setCatName("");
                      await load();
                    } catch {
                      setError(t("admin.createFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {t("admin.add")}
              </button>
            </div>
            <ul className="mt-3 max-h-40 divide-y divide-[var(--border)] overflow-y-auto rounded-lg border border-[var(--border)]">
              {categories.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-muted">{t("admin.noCategories")}</li>
              ) : (
                categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{c.name}</span>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-[var(--danger)] hover:underline"
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminDeleteCategory(c.id);
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
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {editingId ? t("admin.editContent") : t("admin.createDraft")}
                </p>
                <p className="mt-1 text-xs text-muted">{t("admin.contentTypeHint")}</p>
              </div>
              {editingId ? (
                <button type="button" className="shrink-0 text-xs text-muted hover:underline" onClick={resetForm} disabled={busy}>
                  {t("common.cancel")}
                </button>
              ) : null}
            </div>
            {memberMenuPath ? (
              <p className="mt-2 rounded-lg border border-accent/20 bg-accent-soft/40 px-2.5 py-2 text-xs leading-relaxed text-accent">
                {t("admin.contentAppearsIn", { menu: moduleLabel(module), path: memberMenuPath })}
              </p>
            ) : null}
            <div className="mt-3 space-y-2.5">
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.contentTitleField")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="field-input py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
              >
                <option value="article">{t("member.article")}</option>
                <option value="video">{t("member.video")}</option>
              </select>
              <select
                className="field-input py-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">{t("admin.noCategoryOption")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {type === "article" ? (
                <div className="space-y-2.5">
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder={t("admin.body")}
                    minHeightClassName="min-h-[220px]"
                  />
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                    <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                        {uploadingPdf ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      </span>
                      <span className="text-sm font-medium">
                        {uploadingPdf
                          ? t("admin.pdfUploadingProgress", { n: pdfProgress })
                          : t("admin.pdfUploadHint")}
                      </span>
                      <span className="text-[11px] text-muted">{t("admin.pdfUploadLimit")}</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="sr-only"
                        disabled={busy || uploadingPdf}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void handlePdfUpload(file);
                        }}
                      />
                    </label>
                    {uploadingPdf ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                          <div
                            className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                            style={{ width: `${pdfProgress}%` }}
                          />
                        </div>
                        <p className="text-center text-[11px] tabular-nums text-muted">{pdfProgress}%</p>
                      </div>
                    ) : null}
                    {pdfUploadOk && fileUrl ? (
                      <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("admin.pdfUploadSuccess")}
                      </p>
                    ) : null}
                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block truncate text-center text-xs font-medium text-accent hover:underline"
                      >
                        {t("admin.openPdf")}
                      </a>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted">{t("admin.pdfOrBodyHint")}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/40 p-3">
                    <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                        {uploadingVideo ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      </span>
                      <span className="text-sm font-medium">
                        {uploadingVideo
                          ? t("admin.videoUploadingProgress", { n: videoProgress })
                          : t("admin.videoUploadHint")}
                      </span>
                      <span className="text-[11px] text-muted">{t("admin.videoUploadLimit")}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                        className="sr-only"
                        disabled={busy || uploadingVideo}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void handleVideoUpload(file);
                        }}
                      />
                    </label>
                    {uploadingVideo ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                          <div
                            className="h-full rounded-full bg-accent transition-[width] duration-150 ease-out"
                            style={{ width: `${videoProgress}%` }}
                          />
                        </div>
                        <p className="text-center text-[11px] tabular-nums text-muted">{videoProgress}%</p>
                      </div>
                    ) : null}
                    {uploadOk && videoUrl ? (
                      <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("admin.videoUploadSuccess")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-center text-[11px] text-muted">{t("admin.orVideoUrl")}</p>
                  <input
                    className="field-input py-2 text-sm"
                    placeholder={t("admin.videoUrlPlaceholder")}
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setVideoKey(null);
                      setUploadOk(false);
                    }}
                  />
                  {videoUrl ? (
                    <video controls playsInline className="max-h-40 w-full rounded-lg border border-[var(--border)] bg-black" src={videoUrl} />
                  ) : null}
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder={t("admin.videoCaptionOptional")}
                    minHeightClassName="min-h-[120px]"
                  />
                </div>
              )}

              {module === "tutorial" ? (
                <p className="text-xs text-muted">{t("admin.tutorialAlwaysFree")}</p>
              ) : (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
                  {t("status.premium")}
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                {t("admin.publishNow")}
              </label>
              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm"
                disabled={busy || uploadingVideo || uploadingPdf || !canSave}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    setOk(null);
                    try {
                      const payload = buildPayload();
                      if (editingId) {
                        await adminUpdateContent(editingId, payload);
                        setOk(t("admin.contentUpdated"));
                      } else {
                        await adminCreateContent(payload);
                        setOk(t("admin.contentCreated"));
                      }
                      resetForm();
                      await load();
                    } catch (err: unknown) {
                      const ax = err as { response?: { data?: { message?: string }; status?: number } };
                      const msg = ax.response?.data?.message;
                      if (ax.response?.status === 409 || msg === "conflict") {
                        setError(t("admin.slugConflict"));
                      } else {
                        setError(msg || t("admin.saveFailed"));
                      }
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {editingId
                  ? t("admin.saveChanges")
                  : publishNow
                    ? t("admin.saveAndPublish")
                    : t("admin.saveDraft")}
              </button>
              {editingId ? (
                <button type="button" className="btn-ghost w-full py-2 text-sm" disabled={busy} onClick={resetForm}>
                  {t("admin.cancelEdit")}
                </button>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {moduleLabel(module)} · {contents.length} {t("admin.items")}
            </p>
          </div>
          <div className="hidden grid-cols-[auto_1.6fr_0.6fr_0.7fr_0.7fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span className="w-14">{t("admin.order")}</span>
            <span>{t("admin.contentTitleField")}</span>
            <span>{t("admin.type")}</span>
            <span>{t("admin.access")}</span>
            <span>{t("common.status")}</span>
            <span className="text-right">{t("common.actions")}</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <AdminEmpty
              title={t("admin.noContentTitle")}
              description={t("admin.nothingInModule", { module: moduleLabel(module) })}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {contents.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    "grid gap-2 px-4 py-3 transition hover:bg-[var(--surface-2)] md:grid-cols-[auto_1.6fr_0.6fr_0.7fr_0.7fr_auto] md:items-center md:gap-3 md:px-6",
                    editingId === item.id && "bg-accent-soft/40",
                  )}
                >
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted hover:bg-[var(--surface)] hover:text-fg disabled:opacity-30"
                      disabled={busy || index === 0}
                      aria-label={t("admin.moveUp")}
                      onClick={() => void moveContent(index, -1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted hover:bg-[var(--surface)] hover:text-fg disabled:opacity-30"
                      disabled={busy || index === contents.length - 1}
                      aria-label={t("admin.moveDown")}
                      onClick={() => void moveContent(index, 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.category_name || t("admin.uncategorized")}
                      {item.published_at ? ` · ${tr(item.published_at)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm capitalize text-muted">
                    {item.type === "video" ? t("member.video") : t("member.article")}
                  </p>
                  <div>
                    <StatusBadge
                      label={item.is_premium ? "premium" : "free"}
                      tone={item.is_premium ? "warn" : "muted"}
                    />
                  </div>
                  <div>
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                    <button
                      type="button"
                      className="font-medium text-accent hover:underline"
                      disabled={busy}
                      onClick={() => void startEdit(item.id)}
                    >
                      {t("admin.edit")}
                    </button>
                    {item.status !== "published" ? (
                      <button
                        type="button"
                        className="font-medium text-accent hover:underline"
                        disabled={busy}
                        onClick={() =>
                          void (async () => {
                            setBusy(true);
                            setError(null);
                            try {
                              await adminPublishContent(item.id);
                              await load();
                            } catch {
                              setError(t("admin.publishFailed"));
                            } finally {
                              setBusy(false);
                            }
                          })()
                        }
                      >
                        {t("admin.publish")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn("font-medium text-[var(--danger)] hover:underline")}
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminDeleteContent(item.id);
                            if (editingId === item.id) resetForm();
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
