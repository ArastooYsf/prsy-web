"use client";

import { useSiteTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

type ThemedProseProps = {
  html: string;
  className?: string;
};

// Tailwind Typography's prose-invert isn't CSS-variable-driven like the rest
// of the .theme-white-blue override, so rich-text content rendered from a
// Server Component (which can't call useSiteTheme itself) is routed through
// this small client wrapper instead — same fix already applied to Hero.tsx
// and ProductsMegaMenu.tsx, just usable from server-rendered pages too.
export default function ThemedProse({ html, className }: ThemedProseProps) {
  const isDark = useSiteTheme()?.theme === "dark";

  return (
    <div
      className={cn(className, isDark && "prose-invert")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
