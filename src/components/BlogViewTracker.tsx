"use client";

import { useEffect } from "react";

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;

// Fires once per post per ~30min per browser (localStorage timestamp) — enough
// to keep repeated refreshes from inflating the count without real analytics infra.
export default function BlogViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `blogview:${postId}`;
    const last = Number(localStorage.getItem(key) ?? 0);
    if (Date.now() - last < DEDUPE_WINDOW_MS) return;

    localStorage.setItem(key, String(Date.now()));
    fetch("/api/track/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
      keepalive: true,
    }).catch(() => {});
  }, [postId]);

  return null;
}
