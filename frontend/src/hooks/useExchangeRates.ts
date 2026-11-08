"use client";

import { useCallback, useEffect, useState } from "react";
import type { ExchangeRateMap } from "@/lib/currency";

const REFRESH_MS = 60_000;

type ExchangeRatesResponse = {
  ok: boolean;
  rates?: ExchangeRateMap;
  updatedAt?: string;
  message?: string;
};

export function useExchangeRates() {
  const [rates, setRates] = useState<ExchangeRateMap | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/exchange-rates", { cache: "no-store" });
      const json = (await res.json()) as ExchangeRatesResponse;

      if (!json.ok || !json.rates) {
        setError(json.message ?? "Failed to load exchange rates.");
        return;
      }

      setRates(json.rates);
      setUpdatedAt(json.updatedAt ?? null);
      setError(null);
    } catch {
      setError("Failed to load exchange rates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return { rates, updatedAt, loading, error, refresh: load };
}
