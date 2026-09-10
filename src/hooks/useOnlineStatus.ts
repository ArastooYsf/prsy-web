"use client";

import { useEffect, useState } from "react";

// Single source of truth for online/offline status — shared by OfflineBanner
// (to know when to show itself) and the sticky header (to reserve space for
// it via padding, so the fixed banner never overlaps the header's own
// clickable content). `navigator.onLine` for the initial read, then the
// `online`/`offline` window events for live updates — no polling.
export function useOnlineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOffline;
}
