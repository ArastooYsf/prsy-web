import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getProductFiltersContent } from "@/lib/site-content";
import ProductFiltersForm from "@/components/admin/ProductFiltersForm";

export const dynamic = "force-dynamic";

export default async function ProductFiltersAdminPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const content = await getProductFiltersContent();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <SlidersHorizontal className="size-5 text-accent-400" />
          فیلترهای صفحه‌ی محصولات
        </h2>
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>
      <p className="mb-4 text-sm text-foreground/60">
        کدام فیلترها روی صفحه‌ی عمومی محصولات (کنار لیست محصولات) به کاربر نمایش داده شوند و به چه ترتیبی.
      </p>
      <ProductFiltersForm initialContent={content} />
    </div>
  );
}
