import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { parseProductImages, parseProductSpecs } from "@/lib/product-json";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.productCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  if (!product || product.deletedAt) notFound();

  return (
    <ProductForm
      mode="edit"
      categories={categories}
      brands={brands}
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: parseProductImages(product.images),
        specs: parseProductSpecs(product.specs),
        categoryId: product.categoryId,
        brandId: product.brandId,
        availability: product.availability,
        showPrice: product.showPrice,
        price: product.price,
        isActive: product.isActive,
      }}
    />
  );
}
