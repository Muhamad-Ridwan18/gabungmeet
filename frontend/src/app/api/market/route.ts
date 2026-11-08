"use server";

import { NextResponse } from "next/server";

const SYMBOLS = ["XAU/USD", "EUR/USD", "GBP/USD", "BTC/USD"];

function toArray(payload: unknown) {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload)) return payload;
  return Object.values(payload);
}

export async function GET() {
  const apikey = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!apikey) {
    return NextResponse.json({ ok: false, data: [], message: "Missing Twelve Data API key." }, { status: 200 });
  }

  try {
    const params = new URLSearchParams({
      symbol: SYMBOLS.join(","),
      apikey,
    });
    const res = await fetch(`https://api.twelvedata.com/quote?${params.toString()}`, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, data: [], message: "Failed to load market data." }, { status: 200 });
    }

    const json = (await res.json()) as Record<string, unknown>;
    const items = toArray(json)
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        symbol: String(item.symbol ?? ""),
        name: String(item.name ?? item.symbol ?? ""),
        close: Number(item.close ?? 0),
        change: Number(item.change ?? 0),
        percent_change: Number(item.percent_change ?? 0),
      }))
      .filter((item) => item.symbol);

    return NextResponse.json({ ok: true, data: items });
  } catch {
    return NextResponse.json({ ok: false, data: [], message: "Failed to load market data." }, { status: 200 });
  }
}
