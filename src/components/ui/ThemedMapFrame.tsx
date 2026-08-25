"use client";

import { useSiteTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

type ThemedMapFrameProps = {
  title: string;
  src: string;
  className?: string;
};

// Google's embed map only ships a light skin — the grayscale+invert filter
// fakes a dark-mode map to match this site's default dark theme. That fake
// only reads correctly on a dark page; on the light theme the map should
// just render normally, so the filter is dropped there instead of inverting
// twice into a wrong-looking result.
export default function ThemedMapFrame({ title, src, className }: ThemedMapFrameProps) {
  const isDark = useSiteTheme()?.theme === "dark";

  return (
    <iframe
      title={title}
      src={src}
      className={cn(className, isDark && "grayscale invert")}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
