"use client";

import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import {
  adminGetOnboardingVideos,
  adminUpdateOnboardingVideos,
  adminUploadOnboardingVideo,
  type AdminOnboardingVideoSlot,
  type AdminOnboardingVideos,
} from "@/services/onboarding-videos";
import { useT } from "@/i18n/useT";

function videoKind(url: string): "embed" | "file" {
  return url.includes("youtube") || url.includes("youtu.be") || url.includes("vimeo") ? "embed" : "file";
}

type VideoDraft = {
  title: string;
  videoUrl: string;
  isActive: boolean;
  pendingKey: string | null;
  pendingUrl: string | null;
  uploadName: string | null;
};

function slotFromApi(slot: AdminOnboardingVideoSlot): VideoDraft {
  return {
    title: slot.title,
    videoUrl: slot.video_url ?? "",
    isActive: slot.is_active,
    pendingKey: null,
    pendingUrl: null,
    uploadName: null,
  };
}

type SlotKey = "broker_tutorial" | "deposit_tutorial";

export default function AdminOnboardingVideosPage() {
  const { t } = useT();
  const [data, setData] = useState<AdminOnboardingVideos | null>(null);
  const [broker, setBroker] = useState<VideoDraft>({
    title: "",
    videoUrl: "",
    isActive: false,
    pendingKey: null,
    pendingUrl: null,
    uploadName: null,
  });
  const [deposit, setDeposit] = useState<VideoDraft>({
    title: "",
    videoUrl: "",
    isActive: false,
    pendingKey: null,
    pendingUrl: null,
    uploadName: null,
  });
  const brokerFileRef = useRef<HTMLInputElement>(null);
  const depositFileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminGetOnboardingVideos();
      if (res.success && res.data) {
        setData(res.data);
        setBroker(slotFromApi(res.data.broker_tutorial));
        setDeposit(slotFromApi(res.data.deposit_tutorial));
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

  const buildVideoPayload = (
    draft: VideoDraft,
    saved: AdminOnboardingVideoSlot | undefined,
    fallbackTitle: string,
  ) => {
    const title = draft.title.trim() || saved?.title || fallbackTitle;
    const payload: { title: string; is_active: boolean; video_key?: string; video_url?: string } = {
      title,
      is_active: draft.isActive,
    };
    if (draft.pendingKey) payload.video_key = draft.pendingKey;
    else if (draft.videoUrl.trim()) payload.video_url = draft.videoUrl.trim();
    else if (saved?.video_key) payload.video_key = saved.video_key;
    return payload;
  };

  const persistAll = async (overrides?: { broker?: VideoDraft; deposit?: VideoDraft }) => {
    const brokerDraft = overrides?.broker ?? broker;
    const depositDraft = overrides?.deposit ?? deposit;
    const res = await adminUpdateOnboardingVideos({
      broker_tutorial: buildVideoPayload(brokerDraft, data?.broker_tutorial, t("admin.onboardingBrokerDefaultTitle")),
      deposit_tutorial: buildVideoPayload(depositDraft, data?.deposit_tutorial, t("admin.onboardingDepositDefaultTitle")),
    });
    if (!res.success) throw new Error(res.message);
    await load();
    setSuccess(t("admin.onboardingVideosSaved"));
    setError(null);
  };

  const uploadVideo = async (file: File, target: SlotKey) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const up = await adminUploadOnboardingVideo(file);
      if (!up.success || !up.data) throw new Error("upload failed");
      const current = target === "broker_tutorial" ? broker : deposit;
      const setter = target === "broker_tutorial" ? setBroker : setDeposit;
      const nextTitle =
        current.title.trim() ||
        (target === "broker_tutorial" ? t("admin.onboardingBrokerDefaultTitle") : t("admin.onboardingDepositDefaultTitle"));
      const next: VideoDraft = {
        ...current,
        title: nextTitle,
        pendingKey: up.data.key,
        pendingUrl: up.data.url,
        uploadName: file.name,
        videoUrl: "",
        isActive: true,
      };
      setter(next);
      await persistAll(target === "broker_tutorial" ? { broker: next } : { deposit: next });
    } catch {
      setError(t("admin.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const saveAll = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await persistAll();
    } catch {
      setError(t("admin.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const renderVideoSection = (
    label: string,
    target: SlotKey,
    draft: VideoDraft,
    setDraft: (v: VideoDraft) => void,
    fileRef: React.RefObject<HTMLInputElement>,
    saved?: AdminOnboardingVideoSlot,
  ) => {
    const previewUrl = draft.pendingUrl || saved?.video_url || null;
    const previewTitle = draft.title.trim() || saved?.title || label;
    const preview = previewUrl
      ? { title: previewTitle, video_url: previewUrl, kind: videoKind(previewUrl) as "embed" | "file" }
      : null;

    return (
      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-display text-lg font-semibold">{label}</h3>
        <p className="text-sm text-muted">
          {target === "broker_tutorial" ? t("admin.onboardingBrokerHint") : t("admin.onboardingDepositHint")}
        </p>
        <input
          className="field-input w-full"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder={label}
          disabled={loading || busy}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            className="hidden"
            disabled={loading || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void uploadVideo(file, target);
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            className="btn-secondary px-4 py-2 text-sm"
            disabled={loading || busy}
            onClick={() => fileRef.current?.click()}
          >
            {t("admin.chooseVideo")}
          </button>
          {draft.uploadName ? <span className="text-xs text-muted">{draft.uploadName}</span> : null}
        </div>
        <input
          className="field-input w-full"
          value={draft.videoUrl}
          onChange={(e) =>
            setDraft({
              ...draft,
              videoUrl: e.target.value,
              pendingKey: null,
              pendingUrl: null,
              uploadName: null,
            })
          }
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading || busy}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
            disabled={loading || busy}
          />
          {t("admin.onboardingVideoActive")}
        </label>
        {preview ? (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <LandingHookVideoPlayer video={preview} fallbackTitle={previewTitle} autoPlay={false} />
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title={t("admin.onboardingVideosTitle")} description={t("admin.onboardingVideosDesc")} />

      {error ? (
        <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      {renderVideoSection(
        t("admin.onboardingBrokerVideo"),
        "broker_tutorial",
        broker,
        setBroker,
        brokerFileRef,
        data?.broker_tutorial,
      )}
      {renderVideoSection(
        t("admin.onboardingDepositVideo"),
        "deposit_tutorial",
        deposit,
        setDeposit,
        depositFileRef,
        data?.deposit_tutorial,
      )}

      <button
        type="button"
        className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        disabled={loading || busy}
        onClick={() => void saveAll()}
      >
        {busy ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}
