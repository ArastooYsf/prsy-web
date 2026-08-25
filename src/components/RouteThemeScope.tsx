"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type LandingTheme = "light" | "dark";

// How long the cross-fade between palettes runs — matches the duration
// baked into the .theme-transitioning rule in globals.css, so the
// temporary class gets removed right as the animation finishes.
const TRANSITION_MS = 450;

type LandingThemeContextValue = {
  /** Only meaningful on "/" — every other route is always the dark/orange theme. */
  theme: LandingTheme;
  toggle: () => void;
};

const LandingThemeContext = createContext<LandingThemeContextValue | null>(null);

// Consumed by the header's toggle button and by the few landing components
// (Hero, the mega menu, the search dropdown, the header's scroll glow) whose
// light/dark choice can't be expressed as a plain CSS-variable swap — e.g.
// Tailwind Typography's prose/prose-invert, or a hardcoded rgba() driven
// through a framer-motion style prop. Returns null outside RouteThemeScope
// or on routes where the toggle doesn't apply.
export function useLandingTheme() {
  return useContext(LandingThemeContext);
}

// Scopes the white/blue palette preview to the landing page only ("/") via
// the .theme-white-blue CSS-variable override (see globals.css) — every
// other route keeps the site's current dark/orange theme untouched. Wraps
// the whole visible body content (splash, header, page, footer, cookie
// banner) so the landing page reads as one coherent preview rather than a
// patchwork of old/new colors. Defaults to light on every fresh load
// (deliberately not persisted to localStorage — this is a side-by-side
// preview/comparison tool, not a permanent site preference, and persisting
// it would mean reading localStorage in an effect after mount, which flips
// the theme a beat after first paint for anyone who'd chosen dark — exactly
// the flash-then-reset bug this project already hunted down once).
export default function RouteThemeScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const [theme, setTheme] = useState<LandingTheme>("light");
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
    setTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitioning(false), TRANSITION_MS);
  };

  return (
    <LandingThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={cn(
          "min-h-screen bg-background text-foreground",
          isLandingPage && theme === "light" && "theme-white-blue",
          isLandingPage && transitioning && "theme-transitioning",
        )}
      >
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}
