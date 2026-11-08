"use client";

import { useEffect } from "react";
import { getBranding } from "@/services/branding";
import { useBrandingStore } from "@/store/branding";

function applyFavicon(url: string | null) {
  if (typeof document === "undefined") return;

  const rels = ["icon", "shortcut icon", "apple-touch-icon"];
  for (const rel of rels) {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!url) {
      link?.remove();
      continue;
    }
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = url;
  }
}

export function BrandingBootstrap() {
  const hydrate = useBrandingStore((s) => s.hydrate);
  const logoUrl = useBrandingStore((s) => s.logoUrl);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await getBranding();
        if (!alive) return;
        hydrate(res.success ? (res.data?.logo_url ?? null) : null);
      } catch {
        if (alive) hydrate(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hydrate]);

  useEffect(() => {
    applyFavicon(logoUrl);
  }, [logoUrl]);

  return null;
}
