import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/admin/ProductForm";
import { getSpecSuggestions, getSpecTemplates } from "@/lib/site-content";
import { BASE_SPEC_UNITS, uniqueStrings } from "@/lib/spec-options";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const [categories, brands, specTemplates, suggestions] = await Promise.all([
    prisma.productCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, specTemplateKey: true },
    }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    getSpecTemplates(),
    getSpecSuggestions(),
  ]);

  return <ProductForm
      mode="create"
      categories={categories}
      brands={brands}
      specTemplates={specTemplates}
      unitOptions={uniqueStrings(BASE_SPEC_UNITS, suggestions.units)}
      labelOptions={uniqueStrings(...Object.values(specTemplates), suggestions.labels)}
    />;
}
