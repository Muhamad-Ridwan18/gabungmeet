"use client";

import { useEffect, useRef, useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminChrome";
import { LandingHookVideoPlayer } from "@/components/landing/LandingHookVideoPlayer";
import {
  adminGetMemberHome,
  adminUpdateMemberHome,
  adminUploadBarcode,
  adminUploadMemberVideo,
  type AdminMemberHome,
  type AdminVideoSlot,
} from "@/services/member-home";
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

function slotFromApi(slot: AdminVideoSlot): VideoDraft {
  return {
    title: slot.title,
    videoUrl: slot.video_url ?? "",
    isActive: slot.is_active,
    pendingKey: null,
    pendingUrl: null,
    uploadName: null,
  };
}

export default function AdminMemberHomePage() {
  const { t } = useT();
  const [data, setData] = useState<AdminMemberHome | null>(null);
  const [welcome, setWelcome] = useState<VideoDraft>({ title: "", videoUrl: "", isActive: false, pendingKey: null, pendingUrl: null, uploadName: null });
  const [tutorial, setTutorial] = useState<VideoDraft>({ title: "", videoUrl: "", isActive: false, pendingKey: null, pendingUrl: null, uploadName: null });
  const [referralTitle, setReferralTitle] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [referralActive, setReferralActive] = useState(true);
  const [barcodeKey, setBarcodeKey] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [barcodeName, setBarcodeName] = useState<string | null>(null);
  const welcomeFileRef = useRef<HTMLInputElement>(null);
  const tutorialFileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await adminGetMemberHome();
      if (res.success && res.data) {
        setData(res.data);
        setWelcome(slotFromApi(res.data.welcome));
        setTutorial(slotFromApi(res.data.tutorial));
        setReferralTitle(res.data.referral.title);
        setReferralLink(res.data.referral.link);
        setReferralActive(res.data.referral.is_active);
        setBarcodeKey(res.data.referral.barcode_key ?? null);
        setBarcodeUrl(res.data.referral.barcode_url ?? null);
        setBarcodeName(null);
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

  const uploadVideo = async (file: File, target: "welcome" | "tutorial") => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const up = await adminUploadMemberVideo(file);
      if (!up.success || !up.data) throw new Error("upload failed");
      const setter = target === "welcome" ? setWelcome : setTutorial;
      const current = target === "welcome" ? welcome : tutorial;
      const nextTitle = current.title.trim() || (target === "welcome" ? t("admin.memberWelcomeDefaultTitle") : t("admin.memberTutorialDefaultTitle"));
      setter({
        ...current,
        title: nextTitle,
        pendingKey: up.data.key,
        pendingUrl: up.data.url,
        uploadName: file.name,
        videoUrl: "",
        isActive: true,
      });
      await persistAll({
        [target]: {
          ...current,
          title: nextTitle,
          pendingKey: up.data.key,
          pendingUrl: up.data.url,
          uploadName: file.name,
          videoUrl: "",
          isActive: true,
        },
      });
    } catch {
      setError(t("admin.uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const buildVideoPayload = (
    draft: VideoDraft,
    saved: AdminVideoSlot | undefined,
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

  const persistAll = async (overrides?: {
    welcome?: VideoDraft;
    tutorial?: VideoDraft;
    referralLink?: string;
    referralTitle?: string;
    referralActive?: boolean;
    barcodeKey?: string | null;
  }) => {
    const welcomeDraft = overrides?.welcome ?? welcome;
    const tutorialDraft = overrides?.tutorial ?? tutorial;
    const res = await adminUpdateMemberHome({
      welcome: buildVideoPayload(welcomeDraft, data?.welcome, t("admin.memberWelcomeDefaultTitle")),
      tutorial: buildVideoPayload(tutorialDraft, data?.tutorial, t("admin.memberTutorialDefaultTitle")),
      referral: {
        title: (overrides?.referralTitle ?? referralTitle).trim() || t("member.referralTitle"),
        link: (overrides?.referralLink ?? referralLink).trim(),
        is_active: overrides?.referralActive ?? referralActive,
        ...((overrides?.barcodeKey ?? barcodeKey) ? { barcode_key: overrides?.barcodeKey ?? barcodeKey! } : {}),
      },
    });
    if (!res.success) throw new Error(res.message);
    await load();
    setSuccess(t("admin.memberHomeSaved"));
    setError(null);
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
    target: "welcome" | "tutorial",
    draft: VideoDraft,
    setDraft: (v: VideoDraft) => void,
    fileRef: React.RefObject<HTMLInputElement>,
    saved?: AdminVideoSlot,
  ) => {
    const previewUrl = draft.pendingUrl || saved?.video_url || null;
    const previewTitle = draft.title.trim() || saved?.title || label;
    const preview = previewUrl
      ? { title: previewTitle, video_url: previewUrl, kind: videoKind(previewUrl) as "embed" | "file" }
      : null;

    return (
      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-display text-lg font-semibold">{label}</h3>
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
          <button type="button" className="btn-secondary px-4 py-2 text-sm" disabled={loading || busy} onClick={() => fileRef.current?.click()}>
            {t("admin.chooseVideo")}
          </button>
          {draft.uploadName ? <span className="text-xs text-muted">{draft.uploadName}</span> : null}
        </div>
        <input
          className="field-input w-full"
          value={draft.videoUrl}
          onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value, pendingKey: null, pendingUrl: null, uploadName: null })}
          placeholder="https://www.youtube.com/watch?v=..."
          disabled={loading || busy}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} disabled={loading || busy} />
          {t("admin.hookVideoActive")}
        </label>
        {preview ? (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <LandingHookVideoPlayer video={preview} fallbackTitle={previewTitle} />
          </div>
        ) : null}
      </section>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title={t("admin.memberHomeTitle")} description={t("admin.memberHomeDesc")} />

      {error ? <p className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">{error}</p> : null}
      {success ? <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

      {renderVideoSection(t("admin.memberWelcomeVideo"), "welcome", welcome, setWelcome, welcomeFileRef, data?.welcome)}

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-display text-lg font-semibold">{t("admin.memberReferralSection")}</h3>
        <input className="field-input w-full" value={referralTitle} onChange={(e) => setReferralTitle(e.target.value)} placeholder={t("member.referralTitle")} disabled={loading || busy} />
        <input className="field-input w-full" value={referralLink} onChange={(e) => setReferralLink(e.target.value)} placeholder="https://..." disabled={loading || busy} />
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={barcodeFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={loading || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void (async () => {
                setBusy(true);
                try {
                  const up = await adminUploadBarcode(file);
                  if (!up.success || !up.data) throw new Error("upload failed");
                  setBarcodeKey(up.data.key);
                  setBarcodeUrl(up.data.url);
                  setBarcodeName(file.name);
                  await persistAll({ barcodeKey: up.data.key });
                } catch {
                  setError(t("admin.uploadFailed"));
                } finally {
                  setBusy(false);
                  if (barcodeFileRef.current) barcodeFileRef.current.value = "";
                }
              })();
            }}
          />
          <button type="button" className="btn-secondary px-4 py-2 text-sm" disabled={loading || busy} onClick={() => barcodeFileRef.current?.click()}>
            {t("admin.uploadBarcode")}
          </button>
          {barcodeName ? <span className="text-xs text-muted">{barcodeName}</span> : null}
        </div>
        {barcodeUrl ? (
          <div className="inline-block rounded-xl border border-[var(--border)] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={barcodeUrl} alt="barcode" className="h-40 w-40 object-contain" />
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={referralActive} onChange={(e) => setReferralActive(e.target.checked)} disabled={loading || busy} />
          {t("admin.memberReferralActive")}
        </label>
      </section>

      {renderVideoSection(t("admin.memberTutorialVideo"), "tutorial", tutorial, setTutorial, tutorialFileRef, data?.tutorial)}

      <button type="button" className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50" disabled={loading || busy} onClick={() => void saveAll()}>
        {busy ? t("common.loading") : t("common.save")}
      </button>
    </div>
  );
}
