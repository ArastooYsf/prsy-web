"use client";

import { useRouter } from "next/navigation";
import { Grid2x2, Grid3x3, List } from "lucide-react";
import { PRODUCT_VIEW_MODE_COOKIE, type ProductViewMode } from "@/lib/product-view-mode";

const MODES: { value: ProductViewMode; label: string; Icon: typeof Grid2x2 }[] = [
  { value: "large", label: "نمای بزرگ", Icon: Grid2x2 },
  { value: "small", label: "نمای کوچک", Icon: Grid3x3 },
  { value: "list", label: "نمای لیستی", Icon: List },
];

// Carries no product data — just flips a cookie and asks the server to
// re-render, so the (server-rendered) product grid never has to become a
// client component just to know which layout to draw.
export default function ViewModeToggle({ mode }: { mode: ProductViewMode }) {
  const router = useRouter();

  const setMode = (next: ProductViewMode) => {
    document.cookie = `${PRODUCT_VIEW_MODE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div role="group" aria-label="نمای نمایش محصولات" className="inline-flex items-center gap-1 rounded-lg border border-foreground/10 bg-foreground/5 p-1">
      {MODES.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors ${
              active ? "bg-background text-accent-500 shadow-sm" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
