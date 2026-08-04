import type { Metadata } from "next";
import ConsultationForm from "@/components/ConsultationForm";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های ارتباطی با پویش راه صنعت یاشار؛ آدرس، تلفن، ایمیل و فرم تماس مستقیم.",
};

const CONTACT_ITEMS = [
  {
    label: "آدرس",
    value: "تهران، خیابان ولیعصر، برج صنعت، طبقه ۵",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: "تلفن",
    value: "۰۲۱-۹۱۰۰۰۰۰۰",
    href: "tel:+982191000000",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 4.5h3.5l1.5 4-2 1.5a11 11 0 005 5l1.5-2 4 1.5V18a2 2 0 01-2 2c-8 0-14-6-14-14a2 2 0 012-1.5z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "ایمیل",
    value: "info@yasharindustry.com",
    href: "mailto:info@yasharindustry.com",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 7l7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            تماس با ما
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-black leading-tight sm:text-5xl">
            راه‌های <span className="text-gradient">ارتباط با ما</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
            از طریق اطلاعات زیر یا فرم تماس، کارشناسان ما در سریع‌ترین زمان
            ممکن پاسخگوی شما خواهند بود.
          </p>
        </div>
      </section>

      <section className="relative pb-20 pt-4 sm:pb-28">
        <div className="container">
          <div className="mx-auto mb-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {CONTACT_ITEMS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-transparent bg-white/[0.03] p-6 text-center"
              >
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/10 text-accent-400">
                  {item.icon}
                </div>
                <p className="mt-4 text-sm font-semibold">{item.label}</p>
                {item.href ? (
                  <a
                    href={item.href}
                    dir="ltr"
                    className="mt-1 block text-sm text-foreground/70 transition-colors hover:text-accent-400"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-sm leading-6 text-foreground/70">
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          <ConsultationForm />
        </div>
      </section>
    </>
  );
}
