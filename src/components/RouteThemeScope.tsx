"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SiteTheme = "light" | "dark";

// How long the cross-fade between palettes runs — matches the duration
// baked into the .theme-transitioning rule in globals.css, so the
// temporary class gets removed right as the animation finishes.
const TRANSITION_MS = 450;

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

// Site-wide light/dark toggle via the .theme-white-blue CSS-variable override
// (see globals.css) — swaps every semantic token (background, foreground,
// border, accent scale, etc.) at once, so it applies uniformly regardless of
// route. Wraps the whole visible body content (splash, header, page, footer,
// cookie banner, and every /account/* page since Header itself doesn't
// render there). Defaults to light on every fresh load — deliberately not
// persisted to localStorage, since reading it back in an effect after mount
// would flip the theme a beat after first paint for anyone who'd chosen
// dark, reproducing the exact flash-then-reset bug this project already
// hunted down once.
export default function RouteThemeScope({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>("light");
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
    setTransitioning(true);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setTransitioning(false), TRANSITION_MS);
  };

  return (
    <SiteThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={cn(
          "min-h-screen bg-background text-foreground",
          theme === "light" && "theme-white-blue",
          transitioning && "theme-transitioning",
        )}
      >
        {children}
      </div>
    </SiteThemeContext.Provider>
  );
}
