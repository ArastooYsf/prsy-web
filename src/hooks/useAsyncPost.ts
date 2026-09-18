"use client";

import { useState } from "react";

/** Shared fetch+loading state machine for admin "button → POST → show result" actions (e.g. TestConnectionButton, RetryNationalIdInquiry) — each caller keeps its own success/error handling, this just owns the request lifecycle. */
export function useAsyncPost() {
  const [loading, setLoading] = useState(false);

  const run = async (url: string, body?: unknown): Promise<{ ok: boolean; body: unknown }> => {
    setLoading(true);
    const res = await fetch(url, {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const parsed = await res.json().catch(() => null);
    setLoading(false);
    return { ok: res.ok, body: parsed };
  };

  return { loading, run };
}
