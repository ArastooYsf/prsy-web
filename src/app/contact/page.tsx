import type { Metadata } from "next";
import { MapPin, Phone as PhoneIcon, EnvelopeSimple } from "@phosphor-icons/react/ssr";
import { getFooterContact, getLegalPageHtml } from "@/lib/site-content";
import { SOCIAL_ICONS } from "@/lib/social-icons";
import { toPersianDigits } from "@/lib/format-number";
import ThemedMapFrame from "@/components/ui/ThemedMapFrame";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";
import ThemedProse from "@/components/ui/ThemedProse";

export const metadata: Metadata = {
  title: "تماس با ما",
  description:
    "راه‌های ارتباطی با پویش راه صنعت یاشار؛ آدرس، تلفن، ایمیل و شبکه‌های اجتماعی.",
};

const ADDRESS_ICON = <MapPin size={22} />;
const PHONE_ICON = <PhoneIcon size={22} />;
const EMAIL_ICON = <EnvelopeSimple size={22} />;

export default async function ContactPage() {
  const [contact, introHtml] = await Promise.all([getFooterContact(), getLegalPageHtml("contact-intro")]);

  type ContactItem = { label: string; value: string; href?: string; icon: React.ReactNode };
  const rawContactItems: (ContactItem | null)[] = [
    { label: "آدرس", value: contact.address, href: undefined, icon: ADDRESS_ICON },
    contact.phone
      ? { label: "تلفن", value: toPersianDigits(contact.phone), href: contact.phoneHref || undefined, icon: PHONE_ICON }
      : null,
    contact.email ? { label: "ایمیل", value: contact.email, href: `mailto:${contact.email}`, icon: EMAIL_ICON } : null,
  ];
  const contactItems = rawContactItems.filter((item): item is ContactItem => item !== null);

  const socials = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .map((key) => ({ ...SOCIAL_ICONS[key], href: contact[key] }))
    .filter((social) => social.href);

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
          <ThemedProse
            html={introHtml}
            className="prose prose-sm mx-auto mt-5 max-w-2xl text-balance leading-7 [&_a]:text-accent-400 [&_p]:text-foreground/70"
          />
        </div>
      </section>

      <section className="relative pb-20 pt-4 sm:pb-28">
        <div className="container">
          <div className="mx-auto mb-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {contactItems.map((item) => (
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
              src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed`}
              className="h-72 w-full sm:h-80"
            />
          </div>

          {socials.length > 0 && (
            <div className="mx-auto mt-10 max-w-2xl text-center">
              <p className="text-sm font-semibold text-foreground/70">
                ما را در شبکه‌های اجتماعی دنبال کنید
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                {socials.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/10 text-foreground/60 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
