import { API_URL } from "@/constants";
import type { PublicBranding } from "@/services/branding";

export async function fetchPublicBranding(): Promise<PublicBranding> {
  const endpoint = API_URL.startsWith("http")
    ? `${API_URL}/settings/branding`
    : `${process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8081"}/v1/settings/branding`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 60 } });
    if (!res.ok) return { logo_url: null };
    const json = (await res.json()) as { data?: PublicBranding };
    return json.data ?? { logo_url: null };
  } catch {
    return { logo_url: null };
  }
}
