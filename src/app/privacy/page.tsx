import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: "سیاست حریم خصوصی پویش راه صنعت یاشار؛ چه اطلاعاتی جمع‌آوری می‌شود و چگونه از آن محافظت می‌کنیم.",
};

const SECTIONS = [
  {
    title: "۱. مقدمه",
    body: "شرکت «پویش راه صنعت یاشار» به حریم خصوصی کاربران و مشتریان خود احترام می‌گذارد. این صفحه توضیح می‌دهد چه اطلاعاتی از شما جمع‌آوری می‌شود، چگونه استفاده می‌شود، و چگونه از آن محافظت می‌کنیم.",
  },
  {
    title: "۲. چه اطلاعاتی جمع‌آوری می‌کنیم",
    body: "از طریق فرم‌های درخواست مشاوره و تماس، اطلاعاتی مانند نام، شماره تماس، ایمیل، و توضیحات درخواست شما دریافت می‌شود. این اطلاعات فقط با رضایت و اقدام مستقیم شما (پر کردن فرم) جمع‌آوری می‌شود.",
  },
  {
    title: "۳. نحوه استفاده از اطلاعات",
    body: "اطلاعات ارسالی صرفاً برای موارد زیر استفاده می‌شود:",
    list: [
      "تماس با شما جهت پاسخ به درخواست مشاوره یا استعلام قیمت",
      "ارائه خدمات و پیگیری سفارش‌ها",
      "بهبود کیفیت خدمات‌رسانی",
    ],
    after: "اطلاعات شما به هیچ شخص یا شرکت ثالثی فروخته یا اجاره داده نمی‌شود.",
  },
  {
    title: "۴. کوکی‌ها و ابزارهای تحلیلی",
    body: "این وب‌سایت ممکن است از ابزارهایی مانند Google Analytics برای بررسی نحوه استفاده کاربران از سایت و بهبود تجربه کاربری استفاده کند. این ابزارها اطلاعات کلی (مانند صفحات بازدیدشده) را جمع‌آوری می‌کنند، نه اطلاعات شخصی حساس.",
  },
  {
    title: "۵. امنیت اطلاعات",
    body: "تلاش می‌کنیم با استفاده از استانداردهای امنیتی مناسب (مانند اتصال رمزنگاری‌شده HTTPS) از اطلاعات شما محافظت کنیم.",
  },
  {
    title: "۶. حقوق شما",
    body: "شما می‌توانید در هر زمان درخواست حذف یا اصلاح اطلاعات شخصی خود را از طریق راه‌های ارتباطی موجود در صفحه تماس با ما مطرح کنید.",
  },
  {
    title: "۷. تغییرات این سیاست",
    body: "این صفحه ممکن است به‌مرور به‌روزرسانی شود. تاریخ آخرین به‌روزرسانی در پایین همین صفحه نمایش داده خواهد شد.",
  },
];

export default function PrivacyPage() {
  return (
    <section className="relative pb-20 pt-24 sm:pb-28 sm:pt-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold text-accent-400">
            حریم خصوصی
          </span>
          <h1 className="mt-3 text-balance text-3xl font-black leading-tight sm:text-4xl">
            سیاست حریم خصوصی
          </h1>
          <p className="mt-4 leading-7 text-foreground/70">
            آخرین به‌روزرسانی: ۱۳ مرداد ۱۴۰۵
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl space-y-10">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h2 className="text-lg font-bold">{s.title}</h2>
              <p className="mt-3 leading-7 text-foreground/70">{s.body}</p>
              {s.list && (
                <ul className="mt-3 space-y-2">
                  {s.list.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 leading-7 text-foreground/70"
                    >
                      <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-accent-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {s.after && (
                <p className="mt-3 leading-7 text-foreground/70">{s.after}</p>
              )}
            </div>
          ))}

          <div>
            <h2 className="text-lg font-bold">۸. تماس با ما</h2>
            <p className="mt-3 leading-7 text-foreground/70">
              برای هرگونه سوال درباره حریم خصوصی، از طریق{" "}
              <Link
                href="/contact"
                className="font-semibold text-accent-400 transition-colors hover:text-white"
              >
                صفحه تماس با ما
              </Link>{" "}
              در ارتباط باشید.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
