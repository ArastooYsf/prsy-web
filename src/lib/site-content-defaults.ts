import type { CategoryIconKey } from "@/lib/category-icons";

// Deliberately free of server-only imports (no Prisma) — this module is
// imported by client components (Hero, ProductCategories, SiteContentForm)
// as well as the server-only src/lib/site-content.ts. Pulling in Prisma here
// would drag the mariadb driver (which needs Node's `fs`) into client bundles.

export type HeroSlideContent = {
  id: string;
  title: string;
  description: string; // rich HTML (Bold/list), sanitized on read
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

export type ProductCategoryContent = {
  id: string;
  title: string;
  description: string; // rich HTML (Bold/list), sanitized on read
  iconKey: CategoryIconKey;
  conditions: ("new" | "used" | "service")[];
  brands: string[];
  image?: string;
};

export type FooterContactContent = {
  address: string;
  phone: string; // display label, e.g. "۰۲۱-۹۱۰۰۰۰۰۰"
  phoneHref: string; // e.g. "tel:+982191000000"
  email: string;
  // Empty string hides that platform's icon in the footer — icons themselves
  // stay hardcoded in Footer.tsx, only the destination URL is admin-editable.
  instagramUrl: string;
  linkedinUrl: string;
  telegramUrl: string;
};

export const DEFAULT_FOOTER_CONTACT: FooterContactContent = {
  address: "تهران، خیابان ولیعصر، برج صنعت، طبقه ۵",
  phone: "۰۲۱-۹۱۰۰۰۰۰۰",
  phoneHref: "tel:+982191000000",
  email: "info@yasharindustry.com",
  instagramUrl: "",
  linkedinUrl: "",
  telegramUrl: "",
};

export const DEFAULT_HERO_SLIDES: HeroSlideContent[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور صنعتی و تجاری",
    description:
      "<p>تأمین انواع دیزل ژنراتور در ظرفیت‌های مختلف، با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.</p>",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#diesel-generators",
    image: "products/diesel-generators.svg",
  },
  {
    id: "power-engines",
    title: "موتور برق خانگی و تجاری",
    description:
      "<p>موتور برق‌های قابل‌حمل و ثابت، مناسب مصارف خانگی و تجاری، با گارانتی و پشتیبانی کامل.</p>",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products#power-engines",
    image: "products/power-engines.svg",
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی اورجینال",
    description: "<p>تأمین قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق، فقط به‌صورت نو.</p>",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#spare-parts",
    image: "products/spare-parts.svg",
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description: "<p>اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق، توسط تیم فنی مجرب.</p>",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products#overhaul",
    image: "products/overhaul.svg",
  },
];

export const DEFAULT_PRODUCT_CATEGORIES: ProductCategoryContent[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور",
    description: "<p>دیزل ژنراتورهای صنعتی و تجاری در ظرفیت‌های مختلف</p>",
    iconKey: "generator",
    conditions: ["new", "used"],
    brands: ["کاترپیلار", "کامینز", "پرکینز", "ولوو", "ویچای", "جی‌ام (GM)"],
  },
  {
    id: "power-engines",
    title: "موتور برق",
    description: "<p>موتور برق‌های قابل‌حمل و ثابت برای مصارف خانگی و تجاری</p>",
    iconKey: "engine",
    conditions: ["new", "used"],
    brands: ["کواکس", "فروسکی", "هیوندا", "سایر برندها"],
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی دیزل ژنراتور و موتور برق",
    description: "<p>قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق</p>",
    iconKey: "parts",
    conditions: ["new"],
    brands: ["کاترپیلار", "ولوو", "کامینز", "ویچای", "پرکینز", "جی‌ام"],
  },
  {
    id: "generator-engines",
    title: "موتور ژنراتور",
    description: "<p>موتور به‌صورت مجزا، جدای از ژنراتور کامل</p>",
    iconKey: "generator-engine",
    conditions: ["new", "used"],
    brands: ["کاترپیلار", "کامینز", "پرکینز", "ولوو", "ویچای", "جی‌ام", "کواکس", "فروسکی", "هیوندا"],
  },
  {
    id: "alternators",
    title: "دینام / آلترناتور",
    description: "<p>دینام و آلترناتورهای سازگار با انواع دیزل ژنراتور</p>",
    iconKey: "alternator",
    conditions: ["new", "used"],
    brands: ["استمفورد", "مک‌الت", "کینز", "مارلی"],
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description: "<p>اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق</p>",
    iconKey: "service",
    conditions: ["service"],
    brands: ["کاترپیلار", "کامینز", "پرکینز", "ولوو", "ویچای", "جی‌ام", "و سایر برندها"],
  },
];
