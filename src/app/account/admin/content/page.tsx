import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LayoutTemplate } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getHeroSlides, getProductCategories } from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const [heroSlides, categories] = await Promise.all([getHeroSlides(), getProductCategories()]);

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <LayoutTemplate className="size-5 text-accent-400" />
        محتوای سایت
      </h2>
      <p className="mb-6 text-sm text-foreground/60">
        اسلایدر صفحه اصلی و دسته‌بندی محصولات را می‌توانید ویرایش، اضافه یا حذف کنید.
      </p>
      <SiteContentForm initialHeroSlides={heroSlides} initialCategories={categories} />
    </div>
  );
}
