"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";

type AddToCartButtonProps = {
  product: Omit<CartItem, "quantity">;
  /** "icon" for tight card footers, "full" for the buy box's own CTA row. */
  variant?: "icon" | "full";
  className?: string;
};

export default function AddToCartButton({ product, variant = "icon", className }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleClick = () => {
    addItem(product);
    showToast(`«${product.name}» به سبد خرید اضافه شد.`, "success");
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-500 px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-accent-500/25 transition-all hover:-translate-y-0.5 hover:bg-accent-600",
          className,
        )}
      >
        <ShoppingCart className="size-4" aria-hidden />
        افزودن به سبد
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`افزودن ${product.name} به سبد خرید`}
      className={cn(
        "relative z-10 inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-accent-500/40 px-3 text-xs font-semibold text-accent-500 transition-colors hover:bg-accent-500/10",
        className,
      )}
    >
      <ShoppingCart className="size-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">افزودن</span>
    </button>
  );
}
