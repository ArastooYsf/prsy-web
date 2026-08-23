import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";
import type { LucideIcon } from "lucide-react";

type Props = { label: string; value: ReactNode | null; icon: LucideIcon };

// value=null (loading.tsx) falls back to a Skeleton in place of the number —
// the label is static copy, never async, so it always renders for real.
export function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 text-foreground/60">
        <Icon className="size-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold">{value ?? <Skeleton width={64} height={30} />}</p>
    </div>
  );
}
