// Deliberately free of server-only imports (no Prisma) — this module is
// imported by client components (Hero, ProductCategories, SiteContentForm)
// as well as the server-only src/lib/site-content.ts. Pulling in Prisma here
// would drag the mariadb driver (which needs Node's `fs`) into client bundles.

// The `/ssr` subpath (not the bare package) — this module is imported from
// both client components (WhyUs, Features, ...) and server code (site-content.ts,
// layout.tsx). The bare `@phosphor-icons/react` package resolves to a
// client-only build that calls `React.createContext`, which crashes when
// webpack bundles it into the RSC/server graph (no createContext there).
// `/ssr` is the same icon set built to work from both — same fix
// `src/lib/category-icons.tsx` already uses for this exact reason.
import {
  Package,
  Medal,
  Wrench,
  Cube,
  PencilLine,
  ShieldCheck,
  Bank,
  Drop,
  Factory,
  Storefront,
  Star,
  Tag,
  Truck,
} from "@phosphor-icons/react/ssr";
// Type-only import (erased at compile time, no runtime code) — safe even
// though the bare package's runtime export would crash in the RSC bundle.
import type { Icon } from "@phosphor-icons/react";

// Every icon an admin can attach to a card-style content item (WhyUs
// advantages, Features, Customer segments, About principles) — a closed set,
// not free text, so a saved value can never point at a nonexistent icon and
// break rendering. Exactly the 13 icons already hardcoded across those four
// components before this became editable.
export const ICON_OPTIONS = [
  { key: "package", label: "بسته", Icon: Package },
  { key: "medal", label: "مدال", Icon: Medal },
  { key: "wrench", label: "آچار", Icon: Wrench },
  { key: "cube", label: "مکعب", Icon: Cube },
  { key: "pencil-line", label: "طراحی", Icon: PencilLine },
  { key: "shield-check", label: "تضمین کیفیت", Icon: ShieldCheck },
  { key: "bank", label: "بانک/دولتی", Icon: Bank },
  { key: "drop", label: "قطره (نفت)", Icon: Drop },
  { key: "factory", label: "کارخانه", Icon: Factory },
  { key: "storefront", label: "فروشگاه", Icon: Storefront },
  { key: "star", label: "ستاره", Icon: Star },
  { key: "tag", label: "برچسب قیمت", Icon: Tag },
  { key: "truck", label: "کامیون/ارسال", Icon: Truck },
] as const satisfies { key: string; label: string; Icon: Icon }[];

export type IconKey = (typeof ICON_OPTIONS)[number]["key"];

const ICON_MAP = new Map<string, Icon>(ICON_OPTIONS.map((opt) => [opt.key, opt.Icon]));

/** Looks up an admin-selected icon by its saved key — falls back to the first
 * registry entry for a key that's missing/stale (e.g. saved before this
 * registry existed) rather than rendering nothing. */
export function getIconByKey(key: string): Icon {
  return ICON_MAP.get(key) ?? ICON_OPTIONS[0].Icon;
}

export type HeroSlideContent = {
  id: string;
  title: string;
  description: string; // rich HTML (Bold/list), sanitized on read
  ctaLabel: string;
  ctaHref: string;
  image: string;
};

export type FaqItemContent = {
  id: string;
  question: string;
  answer: string;
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

export const DEFAULT_FAQ_ITEMS: FaqItemContent[] = [
  {
    id: "faq-1",
    question: "چه نوع پروژه‌هایی را می‌پذیرید؟",
    answer:
      "پروژه‌های صنعتی و زیرساختی از جمله خطوط تولید، مجتمع‌های پتروشیمی، نیروگاه‌ها، معادن و واحدهای فرآوری را از مرحله طراحی تا اجرای کامل پوشش می‌دهیم.",
  },
  {
    id: "faq-2",
    question: "زمان تحویل یک پروژه معمولی چقدر است؟",
    answer:
      "بسته به مقیاس و پیچیدگی پروژه متفاوت است؛ در جلسه ارزیابی اولیه، برآورد دقیقی از زمان‌بندی اجرا بر اساس نقشه راه پروژه شما ارائه می‌کنیم.",
  },
  {
    id: "faq-3",
    question: "آیا امکان بازدید حضوری از سایت پروژه وجود دارد؟",
    answer:
      "بله، تیم فنی ما پیش از ارائه پیشنهاد نهایی، بازدید میدانی از سایت انجام می‌دهد تا ارزیابی دقیقی از شرایط اجرایی و محدودیت‌های فنی داشته باشیم.",
  },
  {
    id: "faq-4",
    question: "هزینه جلسه مشاوره اولیه چقدر است؟",
    answer:
      "اولین جلسه مشاوره برای بررسی کلیات پروژه کاملاً رایگان است. هزینه خدمات تخصصی‌تر مانند امکان‌سنجی و طراحی، بر اساس دامنه کار توافق می‌شود.",
  },
  {
    id: "faq-5",
    question: "چگونه همکاری را با تیم شما شروع کنم؟",
    answer:
      "کافی است فرم درخواست مشاوره را تکمیل کنید؛ کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس می‌گیرند تا جلسه ارزیابی اولیه هماهنگ شود.",
  },
  {
    id: "faq-6",
    question: "آیا در سراسر کشور فعالیت می‌کنید؟",
    answer:
      "بله، تیم اجرایی ما آمادگی حضور در پروژه‌های سراسر کشور را دارد و بر اساس موقعیت جغرافیایی پروژه، برنامه‌ریزی لجستیکی لازم انجام می‌شود.",
  },
  {
    id: "faq-7",
    question: "آیا امکان تحویل و نصب دستگاه در محل پروژه وجود دارد؟",
    answer:
      "بله، تیم فنی ما نصب و راه‌اندازی دستگاه را در محل مشتری انجام می‌دهد و تا زمان بهره‌برداری کامل در کنار شما خواهیم بود.",
  },
  {
    id: "faq-8",
    question: "شرایط گارانتی و خدمات پس از فروش چگونه است؟",
    answer:
      "بر اساس نیاز و مذاکره با هر مشتری، قرارداد گارانتی و سرویس دوره‌ای به‌صورت اختصاصی بسته می‌شود و پشتیبانی فنی در طول دوره قرارداد ادامه دارد.",
  },
  {
    id: "faq-9",
    question: "آیا محصولات دست‌دوم هم گارانتی دارند؟",
    answer:
      "محصولات دست‌دوم پس از بازدید فنی و تأیید سلامت دستگاه عرضه می‌شوند و بسته به وضعیت دستگاه، گارانتی محدود قابل ارائه است.",
  },
  {
    id: "faq-10",
    question: "روش‌های همکاری و عقد قرارداد چگونه است؟",
    answer:
      "پس از جلسه ارزیابی اولیه و توافق بر سر دامنه کار، قرارداد رسمی با شرایط پرداخت، زمان‌بندی و تعهدات دو طرف تنظیم و منعقد می‌شود.",
  },
];

// Rich-HTML defaults for the admin-editable legal/contact pages — identical
// wording to what those pages hardcoded before this became editable, so
// turning this feature on doesn't change anything a visitor sees until an
// admin actually edits it.
export const DEFAULT_TERMS_HTML = `<p><strong>۱. کلیات</strong></p>
<p>استفاده از وب‌سایت و خدمات پویش راه صنعت یاشار به معنای پذیرش کامل قوانین و مقررات زیر است. لطفاً پیش از استفاده از خدمات، این صفحه را با دقت مطالعه کنید.</p>
<p><strong>۲. محصولات و خدمات</strong></p>
<p>محصولات نو و دست‌دوم به‌طور شفاف در معرفی هر محصول مشخص شده‌اند. تصاویر و مشخصات فنی جنبه راهنما دارند و ممکن است با نمونه واقعی تفاوت جزئی داشته باشند.</p>
<p><strong>۳. فرآیند سفارش و قیمت‌گذاری</strong></p>
<p>قیمت‌های اعلام‌شده بر اساس نرخ روز محاسبه می‌شوند و تا زمان صدور فاکتور رسمی، قطعی تلقی نمی‌شوند. تغییرات قیمت ممکن است بدون اطلاع قبلی رخ دهد.</p>
<p><strong>۴. گارانتی و خدمات پس از فروش</strong></p>
<p>شرایط گارانتی و خدمات پس از فروش بر اساس نوع محصول (نو یا دست‌دوم) و توافق مکتوب با هر مشتری تعیین و در قرارداد جداگانه ذکر می‌شود.</p>
<p><strong>۵. حریم خصوصی</strong></p>
<p>اطلاعاتی که از طریق فرم‌های تماس و درخواست مشاوره دریافت می‌شود، صرفاً برای پیگیری درخواست شما استفاده می‌شود و در اختیار اشخاص ثالث قرار نخواهد گرفت.</p>
<p><strong>۶. مسئولیت‌ها</strong></p>
<p>پویش راه صنعت یاشار مسئولیت خسارات ناشی از نصب، نگهداری یا استفاده نادرست از تجهیزات خارج از توافقات قراردادی را نمی‌پذیرد.</p>
<p><strong>۷. تغییرات قوانین</strong></p>
<p>این قوانین و مقررات ممکن است در آینده به‌روزرسانی شود. مسئولیت اطلاع از آخرین نسخه بر عهده کاربر است.</p>`;

export const DEFAULT_PRIVACY_HTML = `<p><strong>۱. مقدمه</strong></p>
<p>شرکت «پویش راه صنعت یاشار» به حریم خصوصی کاربران و مشتریان خود احترام می‌گذارد. این صفحه توضیح می‌دهد چه اطلاعاتی از شما جمع‌آوری می‌شود، چگونه استفاده می‌شود، و چگونه از آن محافظت می‌کنیم.</p>
<p><strong>۲. چه اطلاعاتی جمع‌آوری می‌کنیم</strong></p>
<p>بسته به نوع تعامل شما با سایت، اطلاعات زیر جمع‌آوری می‌شود:</p>
<ul>
<li>از طریق فرم‌های تماس و درخواست مشاوره: نام، شماره تماس، ایمیل و توضیحات درخواست شما</li>
<li>هنگام ثبت‌نام حساب کاربری: نام، ایمیل، رمز عبور (به‌صورت رمزنگاری‌شده) و در صورت تمایل، شماره تماس و آدرس</li>
<li>برای حساب‌های حقوقی: نام شرکت و شناسه ملی، جهت استعلام خودکار صحت ثبت شرکت از سامانه‌های رسمی</li>
<li>سابقه‌ی تیکت‌های پشتیبانی، قراردادها و سفارش‌های ثبت‌شده در حساب کاربری شما</li>
</ul>
<p>این اطلاعات فقط با رضایت و اقدام مستقیم شما (پر کردن فرم یا ثبت‌نام) جمع‌آوری می‌شود.</p>
<p><strong>۳. نحوه استفاده از اطلاعات</strong></p>
<p>اطلاعات ارسالی صرفاً برای موارد زیر استفاده می‌شود:</p>
<ul>
<li>تماس با شما جهت پاسخ به درخواست مشاوره یا استعلام قیمت</li>
<li>ارائه خدمات و پیگیری تیکت‌ها، قراردادها و سفارش‌ها</li>
<li>اطلاع‌رسانی خودکار از طریق ایمیل و پیامک درباره‌ی پاسخ تیکت پشتیبانی، تغییر وضعیت سفارش، یا نزدیک شدن به تاریخ انقضای قرارداد — این اطلاع‌رسانی‌ها فقط برای همین منظور استفاده می‌شوند و شماره تماس/ایمیل شما برای هیچ هدف تبلیغاتی دیگری به‌کار نمی‌رود</li>
<li>بهبود کیفیت خدمات‌رسانی</li>
</ul>
<p>اطلاعات شما به هیچ شخص یا شرکت ثالثی فروخته یا اجاره داده نمی‌شود.</p>
<p><strong>۴. کوکی‌ها</strong></p>
<p>این وب‌سایت از چند نوع کوکی/ذخیره‌سازی محلی مرورگر استفاده می‌کند:</p>
<ul>
<li>کوکی‌های ضروری برای ورود و نگه‌داشتن نشست کاربری حساب شما (بدون این کوکی‌ها امکان ورود به حساب کاربری وجود ندارد)</li>
<li>یک مقدار ساده در حافظه‌ی محلی مرورگر برای به‌خاطر سپردن اینکه بنر رضایت کوکی را تأیید کرده‌اید، تا دوباره نمایش داده نشود</li>
<li>در صورت فعال بودن Google Analytics، ابزارهای تحلیلی برای بررسی کلی نحوه استفاده کاربران از سایت (مانند صفحات بازدیدشده)، بدون جمع‌آوری اطلاعات شخصی حساس</li>
</ul>
<p><strong>۵. امنیت اطلاعات</strong></p>
<p>تلاش می‌کنیم با استفاده از استانداردهای امنیتی مناسب (اتصال رمزنگاری‌شده HTTPS، رمزنگاری رمز عبور، محدودسازی تلاش‌های ورود ناموفق و احراز هویت دومرحله‌ای برای مدیران سیستم) از اطلاعات شما محافظت کنیم.</p>
<p><strong>۶. حقوق شما</strong></p>
<p>شما می‌توانید در هر زمان درخواست حذف یا اصلاح اطلاعات شخصی خود را از طریق راه‌های ارتباطی موجود در صفحه تماس با ما مطرح کنید.</p>
<p><strong>۷. تغییرات این سیاست</strong></p>
<p>این صفحه ممکن است به‌مرور به‌روزرسانی شود. تاریخ آخرین به‌روزرسانی در پایین همین صفحه نمایش داده خواهد شد.</p>`;

export const DEFAULT_WARRANTY_HTML = `<p><strong>۱. کلیات</strong></p>
<p>این صفحه شرایط کلی گارانتی و خدمات پس از فروش محصولات و خدمات پویش راه صنعت یاشار را توضیح می‌دهد. با توجه به تنوع محصولات (نو و دست‌دوم) و خدمات ارائه‌شده، شرایط دقیق هر خرید معمولاً در قرارداد یا فاکتور جداگانه با مشتری مشخص و مکتوب می‌شود؛ این صفحه صرفاً یک راهنمای کلی است.</p>
<p><strong>۲. گارانتی محصولات نو</strong></p>
<p>محصولات نو معمولاً مشمول گارانتی کارخانه یا نمایندگی رسمی برند مربوطه هستند. مدت و شرایط دقیق گارانتی (شامل قطعات و خدماتی که تحت پوشش قرار می‌گیرند) بسته به برند و مدل محصول متفاوت است و در مستندات تحویل هر محصول ذکر می‌شود.</p>
<p><strong>۳. محصولات دست‌دوم</strong></p>
<p>محصولات دست‌دوم پیش از فروش از نظر فنی بررسی و وضعیت واقعی آن‌ها به مشتری اعلام می‌شود. شرایط گارانتی این محصولات (در صورت وجود) محدودتر از محصولات نو است و به‌صورت مکتوب و جداگانه در زمان فروش با مشتری توافق می‌شود.</p>
<p><strong>۴. خدمات اورهال و تعمیرات</strong></p>
<p>برای خدمات اورهال و تعمیرات، مدت زمان گارانتی روی کار انجام‌شده (نه لزوماً کل دستگاه) در قرارداد یا فاکتور خدمات مشخص می‌شود.</p>
<p><strong>۵. مواردی که مشمول گارانتی نمی‌شوند</strong></p>
<p>آسیب ناشی از نصب یا استفاده نادرست، نگهداری نامناسب، دخالت افراد غیرمجاز در تعمیر دستگاه، حوادث خارج از کنترل (مانند نوسانات شدید برق یا بلایای طبیعی)، و قطعات مصرفی (مانند فیلتر و روغن) معمولاً مشمول گارانتی نمی‌شوند، مگر آنکه در قرارداد به‌صورت دیگری توافق شده باشد.</p>
<p><strong>۶. فرآیند ثبت درخواست گارانتی/پشتیبانی</strong></p>
<p>برای ثبت درخواست گارانتی یا پشتیبانی، مشتریان دارای حساب کاربری می‌توانند از بخش «تیکت‌های پشتیبانی» در حساب کاربری خود اقدام کنند؛ سایر مراجعان می‌توانند از طریق صفحه تماس با ما درخواست خود را ثبت کنند. زمان بررسی و پاسخ به هر درخواست، بسته به نوع مشکل، متفاوت خواهد بود.</p>
<p><strong>۷. تغییرات این شرایط</strong></p>
<p>این صفحه ممکن است به‌مرور به‌روزرسانی شود. شرایط قید‌شده در قرارداد امضاشده‌ی هر مشتری، در صورت تعارض با این صفحه، اولویت دارد.</p>`;

export const DEFAULT_CONTACT_INTRO_HTML =
  "<p>از طریق اطلاعات زیر با ما در تماس باشید؛ کارشناسان ما در سریع‌ترین زمان ممکن پاسخگوی شما خواهند بود.</p>";

export const DEFAULT_HERO_SLIDES: HeroSlideContent[] = [
  {
    id: "diesel-generators",
    title: "دیزل ژنراتور صنعتی و تجاری",
    description:
      "<p>تأمین انواع دیزل ژنراتور در ظرفیت‌های مختلف، با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.</p>",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products/diesel-generator",
    image: "products/diesel-generators.svg",
  },
  {
    id: "power-engines",
    title: "موتور برق خانگی و تجاری",
    description:
      "<p>موتور برق‌های قابل‌حمل و ثابت، مناسب مصارف خانگی و تجاری، با گارانتی و پشتیبانی کامل.</p>",
    ctaLabel: "مشاهده محصول",
    ctaHref: "/products/power-engine",
    image: "products/power-engines.svg",
  },
  {
    id: "spare-parts",
    title: "قطعات یدکی اورجینال",
    description: "<p>تأمین قطعات یدکی اورجینال برای انواع دیزل ژنراتور و موتور برق، فقط به‌صورت نو.</p>",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/products/spare-parts",
    image: "products/spare-parts.svg",
  },
  {
    id: "overhaul",
    title: "خدمات اورهال و تعمیرات",
    description: "<p>اورهال و تعمیرات تخصصی دیزل ژنراتور و موتور برق، توسط تیم فنی مجرب.</p>",
    ctaLabel: "بیشتر بدانید",
    ctaHref: "/contact",
    image: "products/overhaul.svg",
  },
];

// --- Homepage/marketing sections that were previously hardcoded JSX ---
// Same shape convention as everything above: a typed content object, a
// DEFAULT_* constant that's byte-for-byte what used to be hardcoded (so
// turning this on changes nothing visible until an admin edits it), read
// via site-content.ts, written via a matching /api/admin/site-content/*
// route, edited via a matching admin/*ContentForm.tsx.

export type IconCardContent = {
  title: string;
  description: string;
  icon: IconKey;
};

export type WhyUsContent = {
  eyebrow: string;
  heading: string;
  subheading: string;
  advantages: IconCardContent[];
  partnersLabel: string;
  partnersSubtext: string;
  partners: string[];
};

export const DEFAULT_WHYUS: WhyUsContent = {
  eyebrow: "چرا ما؟",
  heading: "مزیت رقابتی ما در یک نگاه",
  subheading: "دلایلی که مشتریان صنعتی و تجاری برای تأمین دیزل ژنراتور و قطعات یدکی، ما را انتخاب می‌کنند.",
  advantages: [
    {
      title: "تنوع و موجودی بالا",
      description:
        "توانایی تأمین انواع مدل‌های دیزل ژنراتور، قطعات یدکی و تمامی محصولات موجود در دسته‌بندی‌های ما — ژنراتور، موتور برق، قطعات یدکی، دینام و غیره. تقریباً هر مدل و برندی که نیاز داشته باشید را می‌توانید از ما تهیه کنید.",
      icon: "package",
    },
    {
      title: "رزومه و سابقه همکاری معتبر",
      description:
        "افتخار همکاری با شرکت‌های بزرگ و شناخته‌شده صنعت نفت و حفاری کشور را داریم؛ سابقه‌ای که اعتماد کارفرمایان صنعتی را برای ما به همراه آورده است.",
      icon: "medal",
    },
    {
      title: "تیم فنی نصب و راه‌اندازی مجرب",
      description: "تیم فنی باتجربه و متخصص ما، نصب و راه‌اندازی دستگاه‌ها را در محل شما با بالاترین استاندارد ایمنی و کیفیت انجام می‌دهد.",
      icon: "wrench",
    },
  ],
  partnersLabel: "همکاران و مشتریان ما",
  partnersSubtext: "افتخار همکاری با شرکت‌های بزرگ و شناخته‌شده صنعت نفت و حفاری کشور",
  partners: ["شرکت ملی حفاری ایران", "صنعت نفت"],
};

export type CustomersContent = {
  eyebrow: string;
  heading: string;
  subheading: string;
  segments: IconCardContent[];
};

export const DEFAULT_CUSTOMERS: CustomersContent = {
  eyebrow: "مشتریان ما",
  heading: "چه کسانی به ما اعتماد کرده‌اند؟",
  subheading:
    "از شرکت‌های بزرگ دولتی تا کسب‌وکارهای کوچک؛ این تنوع نشان می‌دهد هم توانایی اجرای پروژه‌های بزرگ و رسمی را داریم، هم انعطاف همکاری با کسب‌وکارهای کوچک‌تر را.",
  segments: [
    {
      title: "بخش دولتی",
      description: "شرکت‌های بزرگ دولتی، از جمله شرکت ملی نفت ایران، شرکت ملی حفاری و بسیاری دیگر از شرکت‌های بزرگ دولتی.",
      icon: "bank",
    },
    { title: "صنعت نفت و حفاری", description: "شرکت‌های خصوصی بزرگ و کوچک فعال در حوزه نفت و حفاری.", icon: "drop" },
    { title: "صنایع فولادی و تولیدی", description: "تولیدی‌های بزرگ صنعتی و صنایع فولادی.", icon: "factory" },
    { title: "کسب‌وکارهای کوچک", description: "تولیدی‌ها و کسب‌وکارهای کوچک، با هر نوع و سبک فعالیت کاری.", icon: "storefront" },
  ],
};

export type FeaturesContent = {
  eyebrow: string;
  heading: string;
  subheading: string;
  features: IconCardContent[];
};

export const DEFAULT_FEATURES: FeaturesContent = {
  eyebrow: "خدمات ما",
  heading: "هر آنچه یک پروژه صنعتی برای موفقیت نیاز دارد",
  subheading: "از اولین طرح روی کاغذ تا بهره‌برداری نهایی؛ در هر مرحله همراه شما هستیم.",
  features: [
    {
      title: "طراحی و مهندسی دقیق",
      description: "تیم مهندسی ما با بهره‌گیری از استانداردهای بین‌المللی، طراحی مفهومی تا تفصیلی پروژه‌های صنعتی را با بالاترین دقت انجام می‌دهد.",
      icon: "cube",
    },
    {
      title: "اجرا و مدیریت پیمان",
      description: "با تیمی مجرب و تجهیزات به‌روز، پروژه‌ها را طبق زمان‌بندی و بودجه مصوب و با بالاترین استانداردهای ایمنی اجرا می‌کنیم.",
      icon: "pencil-line",
    },
    {
      title: "بازرسی و تضمین کیفیت",
      description: "پایش مستمر کیفیت در تمامی مراحل پروژه، از تأمین مواد اولیه تا راه‌اندازی نهایی، تضمین‌کننده دوام و ایمنی زیرساخت شماست.",
      icon: "shield-check",
    },
  ],
};

export type StatContent = { value: number; suffix: string; label: string };
export type TestimonialContent = { quote: string; name: string; role: string };

export type SocialProofContent = {
  stats: StatContent[];
  sectors: string[];
  testimonials: TestimonialContent[];
};

export const DEFAULT_SOCIALPROOF: SocialProofContent = {
  stats: [
    { value: 9, suffix: "+", label: "سال سابقه فعالیت" },
    { value: 200, suffix: "+", label: "پروژه تکمیل‌شده" },
    { value: 40, suffix: "+", label: "مهندس و متخصص" },
    { value: 98, suffix: "٪", label: "رضایت کارفرمایان" },
  ],
  sectors: ["فولاد و آلومینیوم", "نفت، گاز و پتروشیمی", "سیمان و مصالح ساختمانی", "معدن و فرآوری", "نیروگاهی و انرژی", "راه و زیرساخت"],
  testimonials: [
    {
      quote:
        "همکاری با تیم یاشار در پروژه توسعه خط تولید، نمونه‌ای از دقت مهندسی و پایبندی به زمان‌بندی بود. از ایمنی اجرا تا کیفیت تحویل، همه‌چیز مطابق تعهد پیش رفت.",
      name: "علی رضایی",
      role: "مدیر پروژه‌های زیرساختی",
    },
    {
      quote: "بازرسی مستمر و گزارش‌دهی شفاف تیم فنی باعث شد در طول اجرای پروژه، همیشه از وضعیت کار مطلع باشیم. تجربه‌ای مطمئن برای یک کارفرمای صنعتی.",
      name: "سارا احمدی",
      role: "مدیر فنی مجتمع صنعتی",
    },
    {
      quote: "از مرحله طراحی مفهومی تا راه‌اندازی نهایی، تیم یاشار راهکارهایی متناسب با محدودیت‌های واقعی پروژه ارائه داد و بودجه پروژه را نیز رعایت کرد.",
      name: "محمد کریمی",
      role: "کارفرمای پروژه احداث نیروگاه",
    },
  ],
};

export type ConsultationContent = {
  eyebrow: string;
  heading: string;
  subheading: string;
};

export const DEFAULT_CONSULTATION: ConsultationContent = {
  eyebrow: "درخواست مشاوره",
  heading: "یک قدم تا شروع همکاری",
  subheading: "فرم زیر را پر کنید تا کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس بگیرند.",
};

export type AboutContent = {
  title: string;
  body: string;
  principles: IconCardContent[];
  yearsValue: number;
  registrationNumber: string;
  registrationLabel: string;
  trustBadgeTitle: string;
  trustBadgeText: string;
};

export const DEFAULT_ABOUT: AboutContent = {
  title: "شریک مطمئن شما در تأمین دیزل ژنراتور",
  body: "پویش راه صنعت یاشار (شماره ثبت ۴۷۶۰۶) از سال ۱۳۹۶ فعالیت خود را با هدف تأمین باکیفیت‌ترین دیزل ژنراتورها و قطعات مرتبط آغاز کرد. از همان روز نخست، محور کار ما بر سه اصل استوار بوده است:",
  principles: [
    { title: "بهترین کیفیت", description: "تأمین محصولات اورجینال و باکیفیت", icon: "star" },
    { title: "بهترین قیمت", description: "رقابتی‌ترین قیمت ممکن در بازار", icon: "tag" },
    { title: "سریع‌ترین تحویل", description: "ارسال به‌موقع و بدون تأخیر", icon: "truck" },
  ],
  yearsValue: 9,
  registrationNumber: "۴۷۶۰۶",
  registrationLabel: "شماره ثبت رسمی",
  trustBadgeTitle: "نشان اعتماد B2B",
  trustBadgeText: "افتخار همکاری با شرکت‌های بزرگ، از جمله شرکت‌های حفاری، را داشته‌ایم.",
};

export type ContactHeroContent = {
  badge: string;
  heading: string;
  mapLabel: string;
};

export const DEFAULT_CONTACT_HERO: ContactHeroContent = {
  badge: "تماس با ما",
  heading: "راه‌های ارتباط با ما",
  mapLabel: "نقشه موقعیت ما",
};

export type LegalPageHeadingContent = {
  eyebrow: string;
  heading: string;
};

export const DEFAULT_LEGAL_HEADINGS: Record<"terms" | "privacy" | "warranty", LegalPageHeadingContent> = {
  terms: { eyebrow: "قوانین و مقررات", heading: "قوانین و مقررات استفاده از خدمات" },
  privacy: { eyebrow: "حریم خصوصی", heading: "سیاست حریم خصوصی" },
  warranty: { eyebrow: "گارانتی و پشتیبانی", heading: "شرایط گارانتی و خدمات پس از فروش" },
};

// Footer href targets stay fixed in code (see Footer.tsx) — only label text
// is admin-editable, keyed by a stable id, so a typo in the admin panel can
// never turn into a broken link on every page of the site.
export type FooterLinkContent = { id: string; label: string };

export type FooterEditableContent = {
  tagline: string;
  copyrightSuffix: string;
  quickLinks: FooterLinkContent[];
  services: FooterLinkContent[];
};

export const DEFAULT_FOOTER_CONTENT: FooterEditableContent = {
  tagline: "تأمین‌کننده دیزل ژنراتور، موتور برق و قطعات یدکی با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم، با بهترین قیمت و سریع‌ترین تحویل.",
  copyrightSuffix: "تمامی حقوق محفوظ است.",
  quickLinks: [
    { id: "home", label: "خانه" },
    { id: "products", label: "محصولات" },
    { id: "features", label: "ویژگی‌ها" },
    { id: "about", label: "درباره ما" },
    { id: "clients", label: "مشتریان" },
    { id: "faq", label: "سوالات متداول" },
    { id: "consultation", label: "درخواست مشاوره" },
    { id: "contact", label: "تماس با ما" },
  ],
  services: [
    { id: "diesel-generator", label: "دیزل ژنراتور" },
    { id: "power-engine", label: "موتور برق" },
    { id: "spare-parts", label: "قطعات یدکی" },
    { id: "alternator", label: "دینام و آلترناتور" },
    { id: "overhaul", label: "اورهال و تعمیرات" },
  ],
};

// Header nav labels — only the visible text is admin-editable; href, order,
// and count of these 5 entries stay fixed in header-2.tsx (that component's
// hover-indicator tracks the real DOM nodes, not this list, so relabeling is
// safe but changing the shape here wouldn't do anything on its own).
export type HeaderNavLabelsContent = {
  home: string;
  about: string;
  clients: string;
  blog: string;
  faq: string;
};

export const DEFAULT_HEADER_NAV_LABELS: HeaderNavLabelsContent = {
  home: "خانه",
  about: "درباره ما",
  clients: "مشتریان",
  blog: "وبلاگ",
  faq: "سوالات متداول",
};
