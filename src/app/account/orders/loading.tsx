import { Package } from "lucide-react";
import Skeleton from "react-loading-skeleton";

const PLACEHOLDER_ROWS = Array.from({ length: 5 });

export default function Loading() {
  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <Package className="size-5 text-accent-400" />
        سفارش‌ها
      </h2>

      <div className="space-y-3">
        {PLACEHOLDER_ROWS.map((_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
          >
            <div>
              <Skeleton width={110} height={16} />
              <Skeleton width={70} height={11} containerClassName="block mt-1" />
              <Skeleton width={90} height={11} containerClassName="block mt-1" />
            </div>
            <Skeleton width={90} height={23} borderRadius={9999} />
          </div>
        ))}
      </div>
    </div>
  );
}
