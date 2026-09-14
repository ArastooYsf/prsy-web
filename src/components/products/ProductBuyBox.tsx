import Link from "next/link";
import { formatNumber } from "@/lib/format-number";
import StatusBadge from "@/components/ui/StatusBadge";
import type { StatusInfo } from "@/lib/status-labels";

export type ProductBuyBoxProps = {
  showPrice: boolean;
  price: number | null;
  availability: StatusInfo;
  ctaHref: string;
  ctaLabel: string;
};

function PriceLine({ showPrice, price }: { showPrice: boolean; price: number | null }) {
  if (showPrice && price != null) {
    return (
      <p dir="ltr" className="text-right text-2xl font-bold text-foreground">
        {formatNumber(price)} تومان
      </p>
    );
  }
  return <p className="text-lg font-bold text-foreground">برای اطلاع از قیمت تماس بگیرید</p>;
}

// Desktop renders a sticky card in the third grid column; mobile renders a
// fixed bottom bar instead — two different visual shapes for the same data,
// not one markup fighting itself across breakpoints via utility overrides.
export default function ProductBuyBox({
  showPrice,
  price,
  availability,
  ctaHref,
  ctaLabel,
}: ProductBuyBoxProps) {
  return (
    <div>
      <div className="hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 lg:sticky lg:top-24 lg:block lg:self-start">
        <StatusBadge status={availability} className="px-2.5 py-1 text-xs" />

        <div className="mt-4">
          <PriceLine showPrice={showPrice} price={price} />
        </div>

        <Link
          href={ctaHref}
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-foreground/10 bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="min-w-0">
          <StatusBadge status={availability} className="mb-1 px-2 py-0.5" />
          <PriceLine showPrice={showPrice} price={price} />
        </div>

        <Link
          href={ctaHref}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
