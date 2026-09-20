import Link from "next/link";
import { PackageX } from "lucide-react";
import { formatNumber } from "@/lib/format-number";
import StatusBadge from "@/components/ui/StatusBadge";
import AddToCartButton from "@/components/products/AddToCartButton";
import type { StatusInfo } from "@/lib/status-labels";
import type { CartItem } from "@/lib/cart";

export type ProductBuyBoxProps = {
  showPrice: boolean;
  price: number | null;
  availability: StatusInfo;
  /** Overrides the price/CTA area entirely with an explanation + a supply-request ticket link — a product being out of stock isn't just "no price to show". */
  isOutOfStock: boolean;
  ctaHref: string;
  ctaLabel: string;
  outOfStockHref: string;
  /** Only needed when showPrice && price != null && !isOutOfStock — that's the one case the CTA becomes "add to cart" instead of a quote/supply-request link. */
  cartProduct: Omit<CartItem, "quantity" | "price"> | null;
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

// The fixed mobile bar has no room for the full sentence (it sits beside,
// not above, the CTA button), so it gets a short version — the button's own
// "درخواست موجودی/تأمین" label already says where the tap goes.
function OutOfStockNotice({ compact = false }: { compact?: boolean } = {}) {
  if (compact) {
    return <p className="text-xs font-semibold text-red-400">ناموجود — برای تأمین تیکت ثبت کنید</p>;
  }
  return (
    <p className="flex items-start gap-1.5 text-sm font-medium text-red-400">
      <PackageX className="mt-0.5 size-4 shrink-0" aria-hidden />
      این محصول در حال حاضر ناموجود است. برای ثبت درخواست تأمین، دکمه‌ی «درخواست موجودی/تأمین» را بزنید.
    </p>
  );
}

// Desktop renders a sticky card in the third grid column; mobile renders a
// fixed bottom bar instead — two different visual shapes for the same data,
// not one markup fighting itself across breakpoints via utility overrides.
export default function ProductBuyBox({
  showPrice,
  price,
  availability,
  isOutOfStock,
  ctaHref,
  ctaLabel,
  outOfStockHref,
  cartProduct,
}: ProductBuyBoxProps) {
  // A priced, in-stock product is added to the cart directly; everything
  // else (unpriced, or out of stock regardless of price) routes to a
  // prefilled support ticket instead.
  const canAddToCart = !isOutOfStock && showPrice && price != null && cartProduct != null;
  const fallbackHref = isOutOfStock ? outOfStockHref : ctaHref;
  const fallbackLabel = isOutOfStock ? "درخواست موجودی/تأمین" : ctaLabel;

  return (
    <div>
      <div className="hidden rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 lg:sticky lg:top-24 lg:block lg:self-start">
        <StatusBadge status={availability} className="px-2.5 py-1 text-xs" />

        <div className="mt-4">
          {isOutOfStock ? <OutOfStockNotice /> : <PriceLine showPrice={showPrice} price={price} />}
        </div>

        {canAddToCart ? (
          <AddToCartButton
            variant="full"
            product={{ ...cartProduct, price: price! }}
            className="mt-5 w-full"
          />
        ) : (
          <Link
            href={fallbackHref}
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600"
          >
            {fallbackLabel}
          </Link>
        )}
      </div>

      {/* Solid background, no backdrop-blur — a `backdrop-filter` on a
          `position: fixed` element that stays on screen through the whole
          scroll forces the browser to recomposite the blur every frame,
          which is exactly what made fast/long touch-drag scrolling feel
          janky on mobile (the header already avoids this same trap by
          scoping its own blur to desktop-only — see its comment). A fully
          opaque background costs nothing extra to keep on screen. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-foreground/10 bg-background px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <div className="min-w-0">
          <StatusBadge status={availability} className="mb-1 px-2 py-0.5" />
          {isOutOfStock ? <OutOfStockNotice compact /> : <PriceLine showPrice={showPrice} price={price} />}
        </div>

        {canAddToCart ? (
          <AddToCartButton variant="full" product={{ ...cartProduct, price: price! }} className="shrink-0" />
        ) : (
          <Link
            href={fallbackHref}
            className="flex min-h-11 shrink-0 items-center justify-center rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            {fallbackLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
