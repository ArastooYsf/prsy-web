import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  LayoutTemplate,
  MapPin,
  HelpCircle,
  ScrollText,
  ShieldCheck,
  BadgeCheck,
  Phone,
  Sparkle,
  Users,
  ListChecks,
  MessageSquareText,
  HandHeart,
  Info,
  Rows,
  Navigation,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import {
  getHeroSlides,
  getFooterContact,
  getFaqItems,
  getLegalPageHtml,
  getWhyUsContent,
  getCustomersContent,
  getFeaturesContent,
  getSocialProofContent,
  getConsultationContent,
  getAboutContent,
  getContactHeroContent,
  getFooterEditableContent,
  getHeaderNavLabels,
  getLegalPageHeading,
} from "@/lib/site-content";
import SiteContentForm from "@/components/admin/SiteContentForm";
import FooterContactForm from "@/components/admin/FooterContactForm";
import FaqManagerForm from "@/components/admin/FaqManagerForm";
import LegalPageForm from "@/components/admin/LegalPageForm";
import WhyUsContentForm from "@/components/admin/WhyUsContentForm";
import CustomersContentForm from "@/components/admin/CustomersContentForm";
import FeaturesContentForm from "@/components/admin/FeaturesContentForm";
import SocialProofContentForm from "@/components/admin/SocialProofContentForm";
import ConsultationContentForm from "@/components/admin/ConsultationContentForm";
import AboutContentForm from "@/components/admin/AboutContentForm";
import ContactHeroForm from "@/components/admin/ContactHeroForm";
import FooterContentForm from "@/components/admin/FooterContentForm";
import HeaderNavLabelsForm from "@/components/admin/HeaderNavLabelsForm";
import SiteContentAccordion, { type SiteContentSection } from "@/components/admin/SiteContentAccordion";

export const dynamic = "force-dynamic";

// Plain-text join of every field value in an icon-card list (WhyUs advantages,
// Customer segments, Features, About principles) — the search bar matches
// against this, not just the section's own static title/description.
function iconCardsSearchText(items: { title: string; description: string }[]): string {
  return items.map((item) => `${item.title} ${item.description}`).join(" ");
}

export default async function AdminContentPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const [
    heroSlides,
    footerContact,
    faqItems,
    termsHtml,
    privacyHtml,
    warrantyHtml,
    contactIntroHtml,
    whyUs,
    customers,
    features,
    socialProof,
    consultation,
    about,
    contactHero,
    footerContent,
    headerNavLabels,
    termsHeading,
    privacyHeading,
    warrantyHeading,
  ] = await Promise.all([
    getHeroSlides(),
    getFooterContact(),
    getFaqItems(),
    getLegalPageHtml("terms"),
    getLegalPageHtml("privacy"),
    getLegalPageHtml("warranty"),
    getLegalPageHtml("contact-intro"),
    getWhyUsContent(),
    getCustomersContent(),
    getFeaturesContent(),
    getSocialProofContent(),
    getConsultationContent(),
    getAboutContent(),
    getContactHeroContent(),
    getFooterEditableContent(),
    getHeaderNavLabels(),
    getLegalPageHeading("terms"),
    getLegalPageHeading("privacy"),
    getLegalPageHeading("warranty"),
  ]);

  const sections: SiteContentSection[] = [
    {
      id: "hero",
      icon: <LayoutTemplate size={18} />,
      title: "اسلایدر صفحه اصلی (Hero)",
      description: "اسلایدهای بالای صفحه اصلی — عنوان، توضیح، دکمه و تصویر هر اسلاید.",
      searchText: heroSlides.map((s) => `${s.title} ${s.description} ${s.ctaLabel}`).join(" "),
      content: <SiteContentForm initialHeroSlides={heroSlides} />,
    },
    {
      id: "whyus",
      icon: <Sparkle size={18} />,
      title: "چرا ما؟ (مزیت‌های رقابتی)",
      description: "بخش مزیت‌های رقابتی و همکاران در صفحه اصلی.",
      searchText: `${whyUs.eyebrow} ${whyUs.heading} ${whyUs.subheading} ${iconCardsSearchText(whyUs.advantages)} ${whyUs.partnersLabel} ${whyUs.partnersSubtext} ${whyUs.partners.join(" ")}`,
      content: <WhyUsContentForm initialContent={whyUs} />,
    },
    {
      id: "customers",
      icon: <Users size={18} />,
      title: "مشتریان ما (بخش‌بندی)",
      description: "بخش‌بندی مشتریان در صفحه اصلی.",
      searchText: `${customers.eyebrow} ${customers.heading} ${customers.subheading} ${iconCardsSearchText(customers.segments)}`,
      content: <CustomersContentForm initialContent={customers} />,
    },
    {
      id: "features",
      icon: <ListChecks size={18} />,
      title: "خدمات ما",
      description: "بخش خدمات/ویژگی‌ها در صفحه اصلی.",
      searchText: `${features.eyebrow} ${features.heading} ${features.subheading} ${iconCardsSearchText(features.features)}`,
      content: <FeaturesContentForm initialContent={features} />,
    },
    {
      id: "socialproof",
      icon: <MessageSquareText size={18} />,
      title: "آمار و نظرات مشتریان",
      description: "آمار، صنایع مشتریان و نظرات مشتریان در صفحه اصلی.",
      searchText: `${socialProof.stats.map((s) => s.label).join(" ")} ${socialProof.sectors.join(" ")} ${socialProof.testimonials.map((t) => `${t.quote} ${t.name} ${t.role}`).join(" ")}`,
      content: <SocialProofContentForm initialContent={socialProof} />,
    },
    {
      id: "consultation",
      icon: <HandHeart size={18} />,
      title: "درخواست مشاوره (عنوان بخش)",
      description: "عنوان و توضیح بالای فرم درخواست مشاوره در صفحه اصلی.",
      searchText: `${consultation.eyebrow} ${consultation.heading} ${consultation.subheading}`,
      content: <ConsultationContentForm initialContent={consultation} />,
    },
    {
      id: "about",
      icon: <Info size={18} />,
      title: "درباره ما",
      description: "متن معرفی، اصول کاری، آمار و نشان اعتماد صفحه «درباره ما».",
      searchText: `${about.title} ${about.body} ${iconCardsSearchText(about.principles)} ${about.registrationLabel} ${about.trustBadgeTitle} ${about.trustBadgeText}`,
      content: <AboutContentForm initialContent={about} />,
    },
    {
      id: "contact-hero",
      icon: <Phone size={18} />,
      title: "هدر صفحه تماس با ما",
      description: "بج، عنوان و برچسب نقشه بالای صفحه «تماس با ما».",
      searchText: `${contactHero.badge} ${contactHero.heading} ${contactHero.mapLabel}`,
      content: <ContactHeroForm initialContent={contactHero} />,
    },
    {
      id: "footer-contact",
      icon: <MapPin size={18} />,
      title: "اطلاعات تماس فوتر و شبکه‌های اجتماعی",
      description: "آدرس، شماره تماس، ایمیل و لینک شبکه‌های اجتماعی — در فوتر سایت و صفحه «تماس با ما» نمایش داده می‌شوند.",
      searchText: `${footerContact.address} ${footerContact.phone} ${footerContact.email}`,
      content: <FooterContactForm initialContact={footerContact} />,
    },
    {
      id: "footer-content",
      icon: <Rows size={18} />,
      title: "متن‌های فوتر",
      description: "متن معرفی، متن حق نشر و لیبل لینک‌های فوتر.",
      searchText: `${footerContent.tagline} ${footerContent.copyrightSuffix} ${footerContent.quickLinks.map((l) => l.label).join(" ")} ${footerContent.services.map((l) => l.label).join(" ")}`,
      content: <FooterContentForm initialContent={footerContent} />,
    },
    {
      id: "header-nav",
      icon: <Navigation size={18} />,
      title: "منوی هدر",
      description: "متن نمایشی آیتم‌های منوی اصلی هدر.",
      searchText: Object.values(headerNavLabels).join(" "),
      content: <HeaderNavLabelsForm initialContent={headerNavLabels} />,
    },
    {
      id: "faq",
      icon: <HelpCircle size={18} />,
      title: "سوالات متداول",
      description: "سوال‌ها همان ترتیبی که اینجا هستند در صفحه «سوالات متداول» و پیش‌نمایش آن در صفحه اصلی نمایش داده می‌شوند.",
      searchText: faqItems.map((item) => `${item.question} ${item.answer}`).join(" "),
      content: <FaqManagerForm initialItems={faqItems} />,
    },
    {
      id: "contact-intro",
      icon: <Phone size={18} />,
      title: "متن مقدمه صفحه تماس با ما",
      description: "این متن بالای صفحه «تماس با ما» نمایش داده می‌شود؛ آدرس/تلفن/ایمیل/شبکه‌های اجتماعی از بخش «اطلاعات تماس فوتر» خوانده می‌شوند.",
      searchText: contactIntroHtml,
      content: <LegalPageForm page="contact-intro" initialHtml={contactIntroHtml} />,
    },
    {
      id: "terms",
      icon: <ScrollText size={18} />,
      title: "قوانین و مقررات",
      description: "عنوان و محتوای کامل صفحه «قوانین و مقررات».",
      searchText: `${termsHeading.eyebrow} ${termsHeading.heading} ${termsHtml}`,
      content: <LegalPageForm page="terms" initialHtml={termsHtml} initialHeading={termsHeading} />,
    },
    {
      id: "privacy",
      icon: <ShieldCheck size={18} />,
      title: "حریم خصوصی",
      description: "عنوان و محتوای کامل صفحه «حریم خصوصی».",
      searchText: `${privacyHeading.eyebrow} ${privacyHeading.heading} ${privacyHtml}`,
      content: <LegalPageForm page="privacy" initialHtml={privacyHtml} initialHeading={privacyHeading} />,
    },
    {
      id: "warranty",
      icon: <BadgeCheck size={18} />,
      title: "گارانتی و پشتیبانی",
      description: "عنوان و محتوای کامل صفحه «گارانتی و پشتیبانی».",
      searchText: `${warrantyHeading.eyebrow} ${warrantyHeading.heading} ${warrantyHtml}`,
      content: <LegalPageForm page="warranty" initialHtml={warrantyHtml} initialHeading={warrantyHeading} />,
    },
  ];

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <LayoutTemplate className="size-5 text-accent-400" />
        محتوای سایت
      </h2>
      <p className="mb-6 text-sm text-foreground/60">
        هر بخش از متن‌های سایت را جدا از بقیه باز/بسته و ویرایش کنید، یا در نوار جست‌وجوی زیر بخش مورد نظر را پیدا کنید.
      </p>
      <SiteContentAccordion sections={sections} />
    </div>
  );
}
