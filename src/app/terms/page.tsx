import type { Metadata } from "next";
import Link from "next/link";

// یادداشت داخلی (غیر قابل مشاهده برای کاربر): متن این صفحه یک پیش‌نویس
// نمونه و عمومی است، نه متن نهایی حقوقی. پیش از انتشار رسمی باید توسط
// مالک کسب‌وکار بازبینی و ترجیحاً با یک مشاور حقوقی تأیید شود.
export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین و مقررات استفاده از خدمات و محصولات پویش راه صنعت یاشار.",
};

const SECTIONS = [
  {
    title: "۱. کلیات",
    body: "استفاده از وب‌سایت و خدمات پویش راه صنعت یاشار به معنای پذیرش کامل قوانین و مقررات زیر است. لطفاً پیش از استفاده از خدمات، این صفحه را با دقت مطالعه کنید.",
  },
  {
    title: "۲. محصولات و خدمات",
    body: "محصولات نو و دست‌دوم به‌طور شفاف در معرفی هر محصول مشخص شده‌اند. تصاویر و مشخصات فنی جنبه راهنما دارند و ممکن است با نمونه واقعی تفاوت جزئی داشته باشند.",
  },
  {
    title: "۳. فرآیند سفارش و قیمت‌گذاری",
    body: "قیمت‌های اعلام‌شده بر اساس نرخ روز محاسبه می‌شوند و تا زمان صدور فاکتور رسمی، قطعی تلقی نمی‌شوند. تغییرات قیمت ممکن است بدون اطلاع قبلی رخ دهد.",
  },
  {
    title: "۴. گارانتی و خدمات پس از فروش",
    body: "شرایط گارانتی و خدمات پس از فروش بر اساس نوع محصول (نو یا دست‌دوم) و توافق مکتوب با هر مشتری تعیین و در قرارداد جداگانه ذکر می‌شود.",
  },
  {
    title: "۵. حریم خصوصی",
    body: "اطلاعاتی که از طریق فرم‌های تماس و درخواست مشاوره دریافت می‌شود، صرفاً برای پیگیری درخواست شما استفاده می‌شود و در اختیار اشخاص ثالث قرار نخواهد گرفت.",
  },
  {
    title: "۶. مسئولیت‌ها",
    body: "پویش راه صنعت یاشار مسئولیت خسارات ناشی از نصب، نگهداری یا استفاده نادرست از تجهیزات خارج از توافقات قراردادی را نمی‌پذیرد.",
  },
  {
    title: "۷. تغییرات قوانین",
    body: "این قوانین و مقررات ممکن است در آینده به‌روزرسانی شود. مسئولیت اطلاع از آخرین نسخه بر عهده کاربر است.",
  },
];

export default function TermsPage() {
  return (
    <section className="relative pb-20 pt-24 sm:pb-28 sm:pt-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold text-accent-400">
            قوانین و مقررات
          </span>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            قوانین و مقررات استفاده از خدمات
          </h1>
          <p className="mt-4 leading-7 text-foreground/70">
            آخرین به‌روزرسانی: مرداد ۱۴۰۵
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-3 leading-7 text-foreground/70">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-3xl text-center leading-7 text-foreground/70">
          برای هرگونه سوال درباره این قوانین، از طریق{" "}
          <Link
            href="/contact"
            className="font-semibold text-accent-400 transition-colors hover:text-white"
          >
            صفحه تماس با ما
          </Link>{" "}
          با ما در ارتباط باشید.
        </p>
      </div>
    </section>
  );
}
