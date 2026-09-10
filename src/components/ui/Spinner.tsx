import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Branded fallback spinner — lucide's Loader2 (already the project's
// spinner idiom, see AdminSearchBox) spun via `animate-spin`, defaulting to
// the accent color. For the loading moments a dedicated Skeleton doesn't
// cover (see RouteLoadingFallback) and small in-button loading states;
// callers override color/size with a text-*/size-* utility.
export default function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn("size-5 animate-spin text-accent-400", className)} />;
}
