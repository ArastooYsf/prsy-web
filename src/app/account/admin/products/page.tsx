import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Boxes, Plus, FolderTree, Tag } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ListFilterBar from "@/components/admin/ListFilterBar";
import SortableHeader from "@/components/admin/SortableHeader";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { param, sortParams, type ListSearchParams } from "@/lib/list-query";
import { PRODUCT_AVAILABILITY } from "@/lib/status-labels";
import { ProductCardMobile, ProductRowDesktop } from "./ProductRow";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const SORT_FIELDS = ["name", "category", "brand", "availability", "price", "createdAt"] as const;

function buildOrderBy(
  field: (typeof SORT_FIELDS)[number],
  dir: "asc" | "desc",
): Prisma.ProductOrderByWithRelationInput {
  if (field === "category") return { category: { name: dir } };
  if (field === "brand") return { brand: { name: dir } };
  return { [field]: dir };
}

export default async function AdminProductsPage({ searchParams }: { searchParams: ListSearchParams }) {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const categoryId = param(searchParams, "category");
  const brandId = param(searchParams, "brand");
  const availability = param(searchParams, "availability");
  const q = param(searchParams, "q");
  const { field, dir } = sortParams(searchParams, SORT_FIELDS, "createdAt");

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(brandId ? { brandId } : {}),
        ...(availability ? { availability: availability as never } : {}),
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: buildOrderBy(field, dir),
      include: { category: true, brand: true },
    }),
    prisma.productCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
    prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Boxes className="size-5 text-accent-400" />
          محصولات
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/account/admin/products/categories"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FolderTree className="size-4" />
            دسته‌بندی‌ها
          </Link>
          <Link
            href="/account/admin/products/brands"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <Tag className="size-4" />
            برندها
          </Link>
          <Link
            href="/account/admin/products/new"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            <Plus className="size-4" />
            محصول جدید
          </Link>
        </div>
      </div>

      <ListFilterBar
        searchPlaceholder="جست‌وجوی نام محصول..."
        selects={[
          {
            key: "category",
            label: "دسته",
            options: categories.map((c) => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name })),
          },
          { key: "brand", label: "برند", options: brands.map((b) => ({ value: b.id, label: b.name })) },
          {
            key: "availability",
            label: "موجودی",
            options: Object.entries(PRODUCT_AVAILABILITY).map(([value, s]) => ({ value, label: s.label })),
          },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState
          icon={<Boxes />}
          title="محصولی با این مشخصات یافت نشد."
          description="اولین محصول را ثبت کنید تا اینجا نمایش داده شود."
          action={{ label: "محصول جدید", href: "/account/admin/products/new" }}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((product) => (
              <ProductCardMobile key={product.id} product={product} />
            ))}
          </div>

          <AdminTableScroll>
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <AdminTh corner="start">
                    <SortableHeader field="name" label="نام" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="category" label="دسته" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="brand" label="برند" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="availability" label="موجودی" />
                  </AdminTh>
                  <AdminTh>
                    <SortableHeader field="price" label="قیمت" />
                  </AdminTh>
                  <AdminTh>انتشار</AdminTh>
                  <AdminTh corner="end" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <ProductRowDesktop key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </>
      )}
    </div>
  );
}
