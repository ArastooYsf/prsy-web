import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LayoutTemplate, MapPin } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getHeroSlides, getProductCategories, getFooterContact } from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";
import FooterContactForm from "@/components/admin/FooterContactForm";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const [heroSlides, categories, footerContact] = await Promise.all([
    getHeroSlides(),
    getProductCategories(),
    getFooterContact(),
  ]);

  return (
    <div className="space-y-10">
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

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <MapPin className="size-5 text-accent-400" />
          اطلاعات تماس فوتر
        </h2>
        <p className="mb-6 text-sm text-foreground/60">
          آدرس، شماره تماس، ایمیل و لینک شبکه‌های اجتماعی که در فوتر سایت نمایش داده می‌شوند.
        </p>
        <FooterContactForm initialContact={footerContact} />
      </div>
    </div>
  );
}
