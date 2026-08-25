"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingTheme } from "@/components/RouteThemeScope";
import { cn } from "@/lib/utils";

// Same easing curve as the header search dropdown / mega menu's open
// transitions (see HeaderSearch.tsx, ProductsMegaMenu.tsx) — keeps every
// "panel/icon settles into place" motion on this page feeling like one
// consistent rhythm rather than a one-off.
const ICON_TRANSITION = { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

// The outgoing icon rotates+shrinks away while the incoming one rotates+grows
// in from the opposite direction — a real swap (via AnimatePresence), not a
// static icon change or a plain opacity crossfade, so the click reads as
// "this flips to the other state" at a glance.
export function ThemeToggleButton({ fullWidth }: { fullWidth?: boolean }) {
  const ctx = useLandingTheme();
  if (!ctx) return null;
  const { theme, toggle } = ctx;
  const isLight = theme === "light";

  return (
    <Button
      type="button"
      size={fullWidth ? "default" : "icon"}
      variant="outline"
      onClick={toggle}
      aria-label={isLight ? "تغییر به تم تیره" : "تغییر به تم روشن"}
      className={cn(fullWidth ? "w-full justify-center gap-2" : "h-9 w-9")}
    >
      <span className="relative inline-flex size-[18px] shrink-0 items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {isLight ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1, transition: ICON_TRANSITION }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0, transition: ICON_TRANSITION }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun className="size-[18px]" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1, transition: ICON_TRANSITION }}
              exit={{ rotate: -90, scale: 0.4, opacity: 0, transition: ICON_TRANSITION }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon className="size-[18px]" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {fullWidth && <span>{isLight ? "تم تیره" : "تم روشن"}</span>}
    </Button>
  );
}
