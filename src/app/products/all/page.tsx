import type { Metadata } from "next";
import CatalogView from "@/components/products/CatalogView";
import type { ListSearchParams } from "@/lib/list-query";

export const metadata: Metadata = {
  title: "همه‌ی محصولات",
  description: "فهرست کامل محصولات پرسی؛ دیزل ژنراتور، موتور برق، قطعات یدکی و موتور ژنراتور از برندهای معتبر جهانی.",
};

export const dynamic = "force-dynamic";

export default function AllProductsPage({ searchParams }: { searchParams: ListSearchParams }) {
  return <CatalogView basePath="/products/all" searchParams={searchParams} />;
}
