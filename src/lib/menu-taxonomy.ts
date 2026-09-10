import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATEGORY_ICON_KEYS, type CategoryIconKey } from "@/lib/category-icons";

export type MenuBrand = { id: string; name: string; slug: string };
export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  icon: CategoryIconKey | null;
  children: { id: string; name: string; slug: string }[];
  brands: MenuBrand[];
};
export type MenuTaxonomy = { categories: MenuCategory[] };

export const PRODUCT_TAXONOMY_TAG = "product-taxonomy";

function normalizeIcon(icon: string | null): CategoryIconKey | null {
  return icon && (CATEGORY_ICON_KEYS as readonly string[]).includes(icon) ? (icon as CategoryIconKey) : null;
}

async function loadMenuTaxonomy(): Promise<MenuTaxonomy> {
  try {
    const [roots, brandProductRows] = await Promise.all([
      prisma.productCategory.findMany({
        where: { parentId: null },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          children: { orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.product.findMany({
        where: { isActive: true, deletedAt: null, brandId: { not: null } },
        select: { categoryId: true, brand: { select: { id: true, name: true, slug: true } } },
        distinct: ["categoryId", "brandId"],
      }),
    ]);

    // Map every category id (root or child) -> its root id.
    const rootIdByAnyCat = new Map<string, string>();
    for (const root of roots) {
      rootIdByAnyCat.set(root.id, root.id);
      for (const child of root.children) rootIdByAnyCat.set(child.id, root.id);
    }

    const brandsByRoot = new Map<string, Map<string, MenuBrand>>();
    for (const row of brandProductRows) {
      if (!row.brand || !row.categoryId) continue;
      const rootId = rootIdByAnyCat.get(row.categoryId);
      if (!rootId) continue;
      if (!brandsByRoot.has(rootId)) brandsByRoot.set(rootId, new Map());
      brandsByRoot.get(rootId)!.set(row.brand.id, row.brand);
    }

    return {
      categories: roots.map((root) => ({
        id: root.id,
        name: root.name,
        slug: root.slug,
        icon: normalizeIcon(root.icon),
        children: root.children,
        brands: [...(brandsByRoot.get(root.id)?.values() ?? [])].sort((a, b) => a.name.localeCompare(b.name, "fa")),
      })),
    };
  } catch {
    return { categories: [] };
  }
}

export const getMenuTaxonomy = unstable_cache(loadMenuTaxonomy, ["menu-taxonomy"], {
  tags: [PRODUCT_TAXONOMY_TAG],
  revalidate: 300,
});
