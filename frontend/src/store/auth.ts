"use client";

import { create } from "zustand";
import type { User } from "@/types/auth";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem("ib_access_token", accessToken);
    localStorage.setItem("ib_refresh_token", refreshToken);
    localStorage.setItem("ib_user", JSON.stringify(user));
    set({ user, accessToken, refreshToken });
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("ib_access_token", accessToken);
    localStorage.setItem("ib_refresh_token", refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => {
    localStorage.setItem("ib_user", JSON.stringify(user));
    set({ user });
  },
  clearSession: () => {
    localStorage.removeItem("ib_access_token");
    localStorage.removeItem("ib_refresh_token");
    localStorage.removeItem("ib_user");
    set({ user: null, accessToken: null, refreshToken: null });
  },
  hydrate: () => {
    try {
      const accessToken = localStorage.getItem("ib_access_token");
      const refreshToken = localStorage.getItem("ib_refresh_token");
      const raw = localStorage.getItem("ib_user");
      const user = raw ? (JSON.parse(raw) as User) : null;
      set({ accessToken, refreshToken, user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
