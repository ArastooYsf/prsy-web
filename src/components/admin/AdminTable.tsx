import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminTableScrollProps = {
  children: ReactNode;
  className?: string;
};

// Desktop/tablet table shell shared by every admin list (products, customers,
// tickets, contracts, orders, blog, logs): a bounded, self-scrolling box
// (rather than relying on the whole page to scroll) so long lists always get
// a real scrollbar and their <thead> can stick to top-0 of this box.
export function AdminTableScroll({ children, className }: AdminTableScrollProps) {
  return (
    <div className={cn("hidden max-h-[65vh] overflow-auto rounded-2xl border border-foreground/10 md:block", className)}>
      {children}
    </div>
  );
}

type AdminThProps = {
  children?: ReactNode;
  className?: string;
  /** Rounds the corner matching AdminTableScroll's own rounded-2xl border — "start" for the first (rightmost, RTL) column, "end" for the last. */
  corner?: "start" | "end";
};

export function AdminTh({ children, className, corner }: AdminThProps) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 bg-background px-4 py-3 text-right font-medium",
        corner === "start" && "rounded-tr-2xl",
        corner === "end" && "rounded-tl-2xl",
        className,
      )}
    >
      {children}
    </th>
  );
}
