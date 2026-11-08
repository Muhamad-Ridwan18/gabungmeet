"use client";

import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  adminGetHookVideo,
  adminUpdateHookVideo,
  adminUploadHookVideo,
  type AdminHookVideo,
} from "@/services/landing";
import { useT } from "@/i18n/useT";

function videoKind(url: string): "embed" | "file" {
  return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo") ? "embed" : "file";
}

export default function AdminLandingPage() {
  const { t } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<AdminHookVideo | null>(null);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminGetHookVideo();
      if (res.success && res.data) {
        setData(res.data);
        setTitle(res.data.title);
        setVideoUrl(res.data.video_url ?? "");
        setIsActive(res.data.is_active);
        setPendingKey(null);
        setPendingUrl(null);
        setUploadName(null);
      }
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

  const persistHookVideo = async (payload: {
    title: string;
    is_active: boolean;
    video_key?: string;
    video_url?: string;
  }) => {
    const res = await adminUpdateHookVideo(payload);
    if (!res.success) throw new Error(res.message || "save failed");
    await load();
    setSuccess(t("admin.hookVideoSaved"));
    setError(null);
  };

  const previewUrl = pendingUrl || data?.video_url || null;
  const previewTitle = title.trim() || data?.title || t("admin.hookVideoTitlePlaceholder");
  const previewVideo = previewUrl
    ? {
        title: previewTitle,
        video_url: previewUrl,
        kind: videoKind(previewUrl),
      }
    : null;

  return (
    <div className="max-w-3xl">
      <AdminPageHeader
        title={t("admin.landingTitle")}
        description={t("admin.landingDesc")}
        actions={
          data?.is_active ? (
            <StatusBadge label={t("admin.hookVideoLive")} tone={statusTone("published")} raw />
          ) : (
            <StatusBadge label={t("admin.hookVideoDraft")} tone={statusTone("draft")} raw />
          )
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.hookVideoTitle")}</label>
          <input
            className="field-input mt-2 w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("admin.hookVideoTitlePlaceholder")}
            disabled={loading || busy}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.hookVideoUpload")}</label>
          <p className="mt-1 text-xs text-muted">{t("admin.hookVideoUploadHint")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="hidden"
              disabled={loading || busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void (async () => {
                  setBusy(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const up = await adminUploadHookVideo(file);
                    if (!up.success || !up.data) throw new Error(up.message || "upload failed");

                    const nextTitle = title.trim() || t("admin.hookVideoTitlePlaceholder");
                    setPendingKey(up.data.key);
                    setPendingUrl(up.data.url);
                    setUploadName(file.name);
                    setVideoUrl("");
                    setTitle(nextTitle);
                    setIsActive(true);

                    await persistHookVideo({
                      title: nextTitle,
                      video_key: up.data.key,
                      is_active: true,
                    });
                  } catch {
                    setError(t("admin.uploadFailed"));
                  } finally {
                    setBusy(false);
                    if (fileRef.current) fileRef.current.value = "";
                  }
                })();
              }}
            />
            <button
              type="button"
              className="btn-secondary px-4 py-2 text-sm"
              disabled={loading || busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? t("common.loading") : t("admin.chooseVideo")}
            </button>
            {uploadName ? <span className="text-xs text-muted">{uploadName}</span> : null}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">{t("admin.hookVideoUrl")}</label>
          <p className="mt-1 text-xs text-muted">{t("admin.hookVideoUrlHint")}</p>
          <input
            className="field-input mt-2 w-full"
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setPendingKey(null);
              setPendingUrl(null);
              setUploadName(null);
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={loading || busy}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading || busy}
          />
          {t("admin.hookVideoActive")}
        </label>

        {previewVideo ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t("member.preview")}</p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <LandingHookVideoPlayer video={previewVideo} fallbackTitle={previewTitle} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary px-4 py-2 text-sm"
            disabled={loading || busy || !title.trim()}
            onClick={() =>
              void (async () => {
                setBusy(true);
                setError(null);
                setSuccess(null);
                try {
                  const payload: {
                    title: string;
                    is_active: boolean;
                    video_key?: string;
                    video_url?: string;
                  } = {
                    title: title.trim(),
                    is_active: isActive,
                  };

                  if (pendingKey) {
                    payload.video_key = pendingKey;
                  } else if (videoUrl.trim()) {
                    payload.video_url = videoUrl.trim();
                  } else if (data?.video_key) {
                    payload.video_key = data.video_key;
                  } else if (!isActive) {
                    payload.video_url = "";
                  } else {
                    setError(t("admin.hookVideoRequired"));
                    return;
                  }

                  await persistHookVideo(payload);
                } catch {
                  setError(t("admin.saveFailed"));
                } finally {
                  setBusy(false);
                }
              })()
            }
          >
            {busy ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
