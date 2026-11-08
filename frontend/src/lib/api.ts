import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth";

const ACCESS_KEY = "ib_access_token";
const REFRESH_KEY = "ib_refresh_token";

/** Force same-origin proxy path even if a bad absolute base sneaks in */
function resolveBaseUrl(configured?: string) {
  const base = String(configured || "");
  if (!base || /^https?:\/\/(localhost|127\.0\.0\.1):300\d/i.test(base)) {
    return "/v1";
  }
  return base;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = resolveBaseUrl(config.baseURL);
    const token = localStorage.getItem(ACCESS_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  // Let the browser set multipart boundary for file uploads.
  // Axios v1 AxiosHeaders needs .delete(); a plain delete often leaves application/json.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const headers = config.headers as { delete?: (key: string) => void; [key: string]: unknown };
    if (typeof headers.delete === "function") {
      headers.delete("Content-Type");
      headers.delete("content-type");
    } else {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }
  }

  return config;
});

/** Shared across concurrent 401s so we only refresh once. */
let refreshPromise: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    // Plain axios so this call skips the interceptors below.
    const { data } = await axios.post(
      `${resolveBaseUrl(API_URL)}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" }, timeout: 20000 },
    );

    const tokens = data?.data?.tokens;
    if (!tokens?.access_token) return null;

    useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token ?? refreshToken);
    return tokens.access_token as string;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = config?.url ?? "";
    const isAuthCall = url.includes("/auth/refresh") || url.includes("/auth/login");

    if (
      typeof window === "undefined" ||
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      isAuthCall ||
      !localStorage.getItem(REFRESH_KEY)
    ) {
      return Promise.reject(error);
    }

    config._retried = true;

    if (!refreshPromise) {
      refreshPromise = requestNewAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const accessToken = await refreshPromise;
    if (!accessToken) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${accessToken}`;
    return api(config);
  },
);
