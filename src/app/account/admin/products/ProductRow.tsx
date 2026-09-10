import Link from "next/link";
import Image from "next/image";
import { Pencil, ImageOff } from "lucide-react";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import { getMediaUrl } from "@/lib/media";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import type { Prisma } from "@/generated/prisma/client";

export type ProductListItem = Prisma.ProductGetPayload<{ include: { category: true; brand: true } }>;

function firstImage(images: Prisma.JsonValue): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;
}

function AvailabilityPill({ value }: { value: string }) {
  const s = PRODUCT_AVAILABILITY[value] ?? PRODUCT_AVAILABILITY.IN_STOCK;
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.className}`}>{s.label}</span>;
}

function priceLabel(showPrice: boolean, price: number | null): string {
  if (!showPrice) return "—";
  if (price == null) return "—";
  return `${formatNumber(price)} تومان`;
}

function Thumb({ path }: { path: string | null }) {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
      {path ? (
        <Image src={getMediaUrl(path)} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-foreground/30">
          <ImageOff className="size-4" />
        </span>
      )}
    </div>
  );
}

export function ProductCardMobile({ product }: { product: ProductListItem }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <div className="flex items-start gap-3">
        <Thumb path={firstImage(product.images)} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{product.name}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {product.category?.name ?? "بدون دسته"} · {product.brand?.name ?? "بدون برند"}
          </p>
        </div>
        <AvailabilityPill value={product.availability} />
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">قیمت</dt>
          <dd dir="ltr" className="text-foreground/70">{priceLabel(product.showPrice, product.price)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">وضعیت انتشار</dt>
          <dd className="text-foreground/70">{product.isActive ? "فعال" : "غیرفعال"}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-foreground/5 pt-3">
        <Link
          href={`/account/admin/products/${product.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
        >
          <Pencil className="size-3.5" />
          ویرایش
        </Link>
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
    </div>
  );
}

export function ProductRowDesktop({ product }: { product: ProductListItem }) {
  return (
    <tr className="border-t border-foreground/10">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Thumb path={firstImage(product.images)} />
          <span className="font-medium">{product.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-foreground/70">{product.category?.name ?? "—"}</td>
      <td className="px-4 py-3 text-foreground/70">{product.brand?.name ?? "—"}</td>
      <td className="px-4 py-3"><AvailabilityPill value={product.availability} /></td>
      <td dir="ltr" className="px-4 py-3 text-right text-foreground/70">{priceLabel(product.showPrice, product.price)}</td>
      <td className="px-4 py-3 text-foreground/60">{product.isActive ? "فعال" : "غیرفعال"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/account/admin/products/${product.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Pencil className="size-3.5" />
            ویرایش
          </Link>
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      </td>
    </tr>
  );
}
