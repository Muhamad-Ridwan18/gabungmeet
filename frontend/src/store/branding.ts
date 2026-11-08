"use client";

import { create } from "zustand";

type BrandingState = {
  logoUrl: string | null;
  hydrated: boolean;
  setLogoUrl: (url: string | null) => void;
  hydrate: (url: string | null) => void;
};

export const useBrandingStore = create<BrandingState>((set) => ({
  logoUrl: null,
  hydrated: false,
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  hydrate: (logoUrl) => set({ logoUrl, hydrated: true }),
}));
