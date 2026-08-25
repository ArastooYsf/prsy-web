"use client";

import { useSiteTheme } from "@/components/RouteThemeScope";

// The decorative grid line color is baked into the Tailwind background-image
// utility itself (see grid-pattern / grid-pattern-dark in tailwind.config.ts)
// since a background-image value can't pick up the .theme-white-blue
// CSS-variable override the way a color utility can. Every page that wants
// this texture goes through here so the light/dark swap is implemented once.
export default function ThemedGridBackdrop() {
  const isDark = useSiteTheme()?.theme === "dark";

  return (
    <div
      className={`pointer-events-none absolute inset-0 bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)] ${
        isDark ? "bg-grid-pattern" : "bg-grid-pattern-dark"
      }`}
    />
  );
}
