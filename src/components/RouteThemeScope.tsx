"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SiteTheme = "light" | "dark";

// How long the cross-fade between palettes runs — matches the duration
// baked into the .theme-transitioning rule in globals.css, so the
// temporary class gets removed right as the animation finishes.
const TRANSITION_MS = 450;

const THEME_COOKIE = "theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

type SiteThemeContextValue = {
  theme: SiteTheme;
  toggle: () => void;
};

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

// Consumed by the header's toggle button and by the handful of components
// whose light/dark choice can't be expressed as a plain CSS-variable swap —
// e.g. Tailwind Typography's prose/prose-invert, or a hardcoded rgba() driven
// through a framer-motion style prop. Returns null outside RouteThemeScope.
export function useSiteTheme() {
  return useContext(SiteThemeContext);
}

// Reads whatever the layout's beforeInteractive script (see layout.tsx)
// already decided from prefers-color-scheme and applied to <html> before
// this component ever mounted or hydrated.
function readDetectedTheme(): SiteTheme {
  return document.documentElement.classList.contains("theme-white-blue") ? "light" : "dark";
}

// Site-wide light/dark toggle via the .theme-white-blue CSS-variable override
// (see globals.css), applied to <html> — not this component's own wrapper —
// because that's the only element guaranteed to already exist when the
// layout's beforeInteractive script runs, before <body> is even parsed
// (see layout.tsx). CSS custom properties cascade down from there to every
// descendant, portals included, with nothing extra required.
//
// `initialTheme` is resolved server-side in layout.tsx (the account's saved
// choice when logged in, else the `theme` cookie) and rendered directly into
// <html>'s className — no flash for a returning visitor. For a genuinely
// first-time, signed-out visitor (initialTheme null), the state below starts
// at the same neutral guess ("dark", matching :root's un-overridden default)
// on both server and client so hydration always has something to agree on —
// reading the DOM at that point would desync server vs. client and force a
// full re-render (this was tried and it broke hydration site-wide). Once
// mounted, a one-time effect corrects that guess to whatever the
// beforeInteractive script already determined from prefers-color-scheme and
// applied to <html> before paint — an ordinary state update at that point,
// not a hydration mismatch, so the background itself never flashed; only a
// handful of JS-computed (non-CSS-variable) accents very briefly lag behind
// on that one first visit.
export default function RouteThemeScope({
  children,
  initialTheme,
  isLoggedIn,
}: {
  children: ReactNode;
  initialTheme: SiteTheme | null;
  isLoggedIn: boolean;
}) {
  const [theme, setTheme] = useState<SiteTheme>(initialTheme ?? "dark");
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialTheme !== null) return;
    const detected = readDetectedTheme();
    setTheme((current) => (current === detected ? current : detected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next: SiteTheme) => {
    if (isLoggedIn) {
      // Fire-and-forget: the toggle already updated the UI instantly, and a
      // failed save just means the next page load falls back to the cookie
      // (or the browser's own preference) — not worth blocking or retrying.
      fetch("/api/account/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: next }),
      }).catch(() => {});
    } else {
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  };

  const toggle = () => {
    const next: SiteTheme = theme === "light" ? "dark" : "light";
    // Flip the actual DOM class immediately, independent of React's own
    // render — <html> is outside this component's returned tree, so there's
    // no JSX path from here to it.
    document.documentElement.classList.toggle("theme-white-blue", next === "light");
    setTheme(next);
    persist(next);
    setTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitioning(false), TRANSITION_MS);
  };

  return (
    <SiteThemeContext.Provider value={{ theme, toggle }}>
      <div className={cn("min-h-screen bg-background text-foreground", transitioning && "theme-transitioning")}>
        {children}
      </div>
    </SiteThemeContext.Provider>
  );
}
