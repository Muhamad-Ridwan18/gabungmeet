import { NextResponse } from "next/server";
import type { CompoundingCurrency, ExchangeRateMap } from "@/lib/currency";

const PROVIDER_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_SECONDS = 60;

type ProviderResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Partial<Record<CompoundingCurrency, number>>;
};

export async function GET() {
  try {
    const res = await fetch(PROVIDER_URL, {
      next: { revalidate: CACHE_SECONDS },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: "Failed to load exchange rates." },
        { status: 200 },
      );
    }

    const json = (await res.json()) as ProviderResponse;
    const eur = json.rates?.EUR;
    const idr = json.rates?.IDR;

    if (json.result !== "success" || !eur || !idr) {
      return NextResponse.json(
        { ok: false, message: "Exchange rate data is incomplete." },
        { status: 200 },
      );
    }

    const rates: ExchangeRateMap = {
      USD: 1,
      EUR: eur,
      IDR: idr,
    };

    return NextResponse.json({
      ok: true,
      base: "USD",
      rates,
      updatedAt: json.time_last_update_utc ?? new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to load exchange rates." },
      { status: 200 },
    );
  }
}
