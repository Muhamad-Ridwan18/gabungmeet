import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/types/auth";

export type ContentModule =
  | "academy"
  | "tutorial"
  | "psychology"
  | "money_management"
  | "daily_analysis"
  | "landing";
export type ContentType = "video" | "article";

export type Category = {
  id: string;
  module: ContentModule;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ContentItem = {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  module: ContentModule;
  type: ContentType;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  file_key?: string | null;
  file_url?: string | null;
  duration_sec?: number | null;
  is_premium: boolean;
  locked: boolean;
  status: string;
  sort_order?: number;
  published_at?: string | null;
  bookmarked?: boolean;
  created_at: string;
};

export async function listCategories(module?: string) {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/categories", {
    params: module ? { module } : undefined,
  });
  return data;
}

export async function listContents(params: {
  module?: string;
  type?: string;
  category_id?: string;
  q?: string;
  status?: string;
  page?: number;
}) {
  const { data } = await api.get<ApiEnvelope<ContentItem[]>>("/contents", { params });
  return data;
}

export async function getContent(slug: string) {
  const { data } = await api.get<ApiEnvelope<ContentItem>>(`/contents/${slug}`);
  return data;
}

export async function listContinue() {
  try {
    const { data } = await api.get<ApiEnvelope<ContentItem[]>>("/contents/continue");
    return data;
  } catch {
    return {
      success: false,
      message: "Continue unavailable",
      data: [] as ContentItem[],
      meta: null,
      errors: null,
    };
  }
}

export async function listBookmarks() {
  const { data } = await api.get<ApiEnvelope<ContentItem[]>>("/bookmarks");
  return data;
}

export async function addBookmark(contentId: string) {
  const { data } = await api.post<ApiEnvelope<null>>("/bookmarks", { content_id: contentId });
  return data;
}

export async function removeBookmark(contentId: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/bookmarks/${contentId}`);
  return data;
}

export async function saveHistory(
  contentId: string,
  input: { progress_pct: number; last_position_sec: number; completed: boolean },
) {
  const { data } = await api.post<ApiEnvelope<null>>(`/history/${contentId}`, input);
  return data;
}

export async function adminListCategories(module?: string) {
  const { data } = await api.get<ApiEnvelope<Category[]>>("/admin/categories", {
    params: module ? { module } : undefined,
  });
  return data;
}

export async function adminCreateCategory(input: {
  module: string;
  name: string;
  slug?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const { data } = await api.post<ApiEnvelope<Category>>("/admin/categories", input);
  return data;
}

export async function adminDeleteCategory(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/admin/categories/${id}`);
  return data;
}

export async function adminListContents(params?: { module?: string; status?: string; q?: string }) {
  const { data } = await api.get<ApiEnvelope<ContentItem[]>>("/admin/contents", { params });
  return data;
}

export async function adminGetContent(id: string) {
  const { data } = await api.get<ApiEnvelope<ContentItem>>(`/admin/contents/${id}`);
  return data;
}

export async function adminCreateContent(input: Record<string, unknown>) {
  const { data } = await api.post<ApiEnvelope<ContentItem>>("/admin/contents", input);
  return data;
}

export async function adminUpdateContent(id: string, input: Record<string, unknown>) {
  const { data } = await api.put<ApiEnvelope<ContentItem>>(`/admin/contents/${id}`, input);
  return data;
}

export async function adminPublishContent(id: string) {
  const { data } = await api.post<ApiEnvelope<ContentItem>>(`/admin/contents/${id}/publish`);
  return data;
}

export async function adminDeleteContent(id: string) {
  const { data } = await api.delete<ApiEnvelope<null>>(`/admin/contents/${id}`);
  return data;
}

export async function adminReorderContents(module: ContentModule, ids: string[]) {
  const { data } = await api.post<ApiEnvelope<null>>("/admin/contents/reorder", { module, ids });
  return data;
}

/** Upload progress that stays monotonic and does not reset when XHR omits `total`. */
function trackUploadProgress(file: File, onProgress?: (percent: number) => void) {
  let last = 0;
  const startedAt = Date.now();
  // Conservative estimate so the bar keeps moving when Cloudflare/XHR events are sparse.
  const assumedBytesPerSec = 400_000;

  const report = (loaded: number, totalHint?: number) => {
    if (!onProgress) return;
    const total = totalHint && totalHint > 0 ? totalHint : file.size || 1;
    const raw = Math.round((Math.min(loaded, total) / total) * 100);
    const elapsedSec = Math.max(0.001, (Date.now() - startedAt) / 1000);
    const estimated = Math.min(92, Math.round(((elapsedSec * assumedBytesPerSec) / total) * 100));
    const next = Math.min(99, Math.max(last, raw, estimated));
    if (next !== last) {
      last = next;
      onProgress(next);
    }
  };

  const tick = window.setInterval(() => {
    report(Math.min(file.size, ((Date.now() - startedAt) / 1000) * assumedBytesPerSec), file.size);
  }, 400);

  return {
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      report(event.loaded, event.total && event.total > 0 ? event.total : file.size);
    },
    done: () => {
      window.clearInterval(tick);
      onProgress?.(100);
    },
    fail: () => {
      window.clearInterval(tick);
    },
  };
}

export async function adminUploadContentVideo(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData();
  form.append("file", file);
  const tracker = trackUploadProgress(file, onProgress);
  try {
    const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads/video", form, {
      timeout: 600_000,
      maxRedirects: 0,
      onUploadProgress: tracker.onUploadProgress,
    });
    tracker.done();
    return data;
  } catch (error) {
    tracker.fail();
    throw error;
  }
}

export async function adminUploadContentPdf(
  file: File,
  onProgress?: (percent: number) => void,
) {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", "document");
  const tracker = trackUploadProgress(file, onProgress);
  try {
    const { data } = await api.post<ApiEnvelope<{ key: string; url: string }>>("/admin/uploads", form, {
      timeout: 600_000,
      maxRedirects: 0,
      onUploadProgress: tracker.onUploadProgress,
    });
    tracker.done();
    return data;
  } catch (error) {
    tracker.fail();
    throw error;
  }
}
