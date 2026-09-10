import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatalogView from "@/components/products/CatalogView";
import type { ListSearchParams } from "@/lib/list-query";

export const dynamic = "force-dynamic";

async function loadCategory(slug: string) {
  return prisma.productCategory.findUnique({
    where: { slug },
    include: { children: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } } },
  });
}

export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const category = await loadCategory(params.categorySlug);
  if (!category || category.parentId) return { title: "محصولات" };
  return {
    title: category.name,
    description: `خرید ${category.name} از برندهای معتبر جهانی؛ مشاهده مشخصات، مقایسه و استعلام قیمت.`,
  };
}

export default async function CategoryCatalogPage({
  params,
  searchParams,
}: {
  params: { categorySlug: string };
  searchParams: ListSearchParams;
}) {
  const category = await loadCategory(params.categorySlug);
  if (!category || category.parentId) notFound();

  return (
    <CatalogView
      basePath={`/products/${category.slug}`}
      searchParams={searchParams}
      category={{ id: category.id, name: category.name, slug: category.slug, children: category.children }}
    />
  );
}
