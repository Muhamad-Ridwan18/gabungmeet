"use client";

import { useEffect, useRef } from "react";
import { me } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { USER_STATUS } from "@/constants";
import { VERIFIED_WELCOME_FLAG } from "@/lib/auth-routing";
import type { UserStatus } from "@/types/auth";

const POLL_MS = 30_000;

const POLL_STATUSES: UserStatus[] = [
  USER_STATUS.onboarding,
  USER_STATUS.pending_verification,
  USER_STATUS.rejected,
];

export function SessionSync() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const prevStatusRef = useRef(user?.status);

  useEffect(() => {
    prevStatusRef.current = user?.status;
  }, [user?.status]);

  useEffect(() => {
    if (!hydrated || !accessToken || !refreshToken) return;

    const sync = async () => {
      try {
        const res = await me();
        if (!res.success || !res.data) return;

        const prev = prevStatusRef.current;
        const next = res.data.status;

        setSession(res.data, accessToken, refreshToken);

        if (prev && prev !== USER_STATUS.verified && next === USER_STATUS.verified) {
          sessionStorage.setItem(VERIFIED_WELCOME_FLAG, "1");
        }

        prevStatusRef.current = next;
      } catch {
        /* ignore */
      }
    };

    void sync();

    const onFocus = () => void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    const shouldPoll = user?.status ? POLL_STATUSES.includes(user.status) : false;
    const timer = shouldPoll ? window.setInterval(() => void sync(), POLL_MS) : undefined;

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) window.clearInterval(timer);
    };
  }, [hydrated, accessToken, refreshToken, setSession, user?.status]);

  return null;
}
