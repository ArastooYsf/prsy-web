import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { LayoutTemplate, MapPin, HelpCircle, ScrollText, ShieldCheck, BadgeCheck, Phone } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getHeroSlides, getFooterContact, getFaqItems, getLegalPageHtml } from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";
import FooterContactForm from "@/components/admin/FooterContactForm";
import FaqManagerForm from "@/components/admin/FaqManagerForm";
import LegalPageForm from "@/components/admin/LegalPageForm";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const [heroSlides, footerContact, faqItems, termsHtml, privacyHtml, warrantyHtml, contactIntroHtml] = await Promise.all([
    getHeroSlides(),
    getFooterContact(),
    getFaqItems(),
    getLegalPageHtml("terms"),
    getLegalPageHtml("privacy"),
    getLegalPageHtml("warranty"),
    getLegalPageHtml("contact-intro"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <LayoutTemplate className="size-5 text-accent-400" />
          محتوای سایت
        </h2>
        <p className="mb-6 text-sm text-foreground/60">
          اسلایدر صفحه اصلی را می‌توانید ویرایش، اضافه یا حذف کنید.
        </p>
        <SiteContentForm initialHeroSlides={heroSlides} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <MapPin className="size-5 text-accent-400" />
          اطلاعات تماس فوتر و شبکه‌های اجتماعی
        </h2>
        <p className="mb-6 text-sm text-foreground/60">
          آدرس، شماره تماس، ایمیل و لینک شبکه‌های اجتماعی — در فوتر سایت و صفحه «تماس با ما» نمایش داده می‌شوند.
        </p>
        <FooterContactForm initialContact={footerContact} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <HelpCircle className="size-5 text-accent-400" />
          سوالات متداول
        </h2>
        <p className="mb-6 text-sm text-foreground/60">
          سوال‌ها همان ترتیبی که اینجا هستند در صفحه‌ی «سوالات متداول» و پیش‌نمایش آن در صفحه اصلی نمایش داده می‌شوند.
        </p>
        <FaqManagerForm initialItems={faqItems} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <Phone className="size-5 text-accent-400" />
          متن مقدمه صفحه تماس با ما
        </h2>
        <p className="mb-6 text-sm text-foreground/60">
          این متن بالای صفحه «تماس با ما» نمایش داده می‌شود؛ آدرس/تلفن/ایمیل/شبکه‌های اجتماعی از بخش «اطلاعات تماس فوتر» بالا خوانده می‌شوند.
        </p>
        <LegalPageForm page="contact-intro" initialHtml={contactIntroHtml} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <ScrollText className="size-5 text-accent-400" />
          قوانین و مقررات
        </h2>
        <p className="mb-6 text-sm text-foreground/60">محتوای کامل صفحه «قوانین و مقررات».</p>
        <LegalPageForm page="terms" initialHtml={termsHtml} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <ShieldCheck className="size-5 text-accent-400" />
          حریم خصوصی
        </h2>
        <p className="mb-6 text-sm text-foreground/60">محتوای کامل صفحه «حریم خصوصی».</p>
        <LegalPageForm page="privacy" initialHtml={privacyHtml} />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
          <BadgeCheck className="size-5 text-accent-400" />
          گارانتی و پشتیبانی
        </h2>
        <p className="mb-6 text-sm text-foreground/60">محتوای کامل صفحه «گارانتی و پشتیبانی».</p>
        <LegalPageForm page="warranty" initialHtml={warrantyHtml} />
      </div>
    </div>
  );
}
