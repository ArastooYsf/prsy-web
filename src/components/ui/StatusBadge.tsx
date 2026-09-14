import { cn } from "@/lib/utils";
import type { StatusInfo } from "@/lib/status-labels";

// Every status/type pill across the site (tickets, orders, contracts,
// products, customers) rendered the exact same markup by hand — label +
// className, no icon. Centralized here so adding the icon meant doing it
// once instead of in each of the ~15 call sites.
export default function StatusBadge({ status, className }: { status: StatusInfo; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        status.className,
        className,
      )}
    >
      {status.icon}
      {status.label}
    </span>
  );
}
