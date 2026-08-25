import type { Metadata } from "next";
import ThemedMapFrame from "@/components/ui/ThemedMapFrame";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های ارتباطی با پویش راه صنعت یاشار؛ آدرس، تلفن، ایمیل و شبکه‌های اجتماعی.",
};

const ADDRESS = "تهران، خیابان ولیعصر، برج صنعت، طبقه ۵";

const CONTACT_ITEMS = [
  {
    label: "آدرس",
    value: ADDRESS,
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

const SOCIALS = [
  {
    name: "اینستاگرام",
    href: "#",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "لینکدین",
    href: "#",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M7.5 10.5V17M7.5 7.5V7.51M11.5 17V10.5M11.5 13c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5V17"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "تلگرام",
    href: "#",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 4L3 11.5l6 2m12-9.5l-3.5 16-8.5-6.5m12-9.5L9 13.5m0 0v5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-14 sm:pt-20">
        <ThemedGridBackdrop />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            تماس با ما
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
            راه‌های <span className="text-accent-soft">ارتباط با ما</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
            از طریق اطلاعات زیر با ما در تماس باشید؛ کارشناسان ما در
            سریع‌ترین زمان ممکن پاسخگوی شما خواهند بود.
          </p>
        </div>
      </section>

      <section className="relative pb-20 pt-4 sm:pb-28">
        <div className="container">
          <div className="mx-auto mb-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {CONTACT_ITEMS.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-transparent bg-foreground/[0.03] p-6 text-center"
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

          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-foreground/10">
            <ThemedMapFrame
              title="نقشه موقعیت ما"
              src={`https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`}
              className="h-72 w-full sm:h-80"
            />
          </div>

          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-sm font-semibold text-foreground/70">
              ما را در شبکه‌های اجتماعی دنبال کنید
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  aria-label={social.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
