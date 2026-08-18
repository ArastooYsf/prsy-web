import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/ui/header-2";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import PageViewTracker from "@/components/PageViewTracker";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import ToastProvider from "@/components/ToastProvider";
import { getFooterContact } from "@/lib/site-content";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yasharindustry.com"),
  title: {
    default: "پویش راه صنعت یاشار | تأمین دیزل ژنراتور و موتور برق",
    template: "%s | پویش راه صنعت یاشار",
  },
  description:
    "پویش راه صنعت یاشار، تأمین‌کننده دیزل ژنراتور، موتور برق، قطعات یدکی و خدمات اورهال با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم، با بهترین قیمت و سریع‌ترین تحویل.",
  keywords: [
    "دیزل ژنراتور",
    "موتور برق",
    "قطعات یدکی ژنراتور",
    "اورهال دیزل ژنراتور",
    "دینام و آلترناتور",
    "پویش راه صنعت یاشار",
  ],
  openGraph: {
    title: "پویش راه صنعت یاشار",
    description:
      "تأمین‌کننده دیزل ژنراتور، موتور برق، قطعات یدکی و خدمات اورهال؛ نو و دست‌دوم.",
    locale: "fa_IR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060a17",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const footerContact = await getFooterContact();

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ScrollProgress />
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <SessionProviderWrapper>
          <ToastProvider>
            <PageViewTracker />
            <PageLoader />
            <Header />
            <main>{children}</main>
            <Footer contact={footerContact} />
          </ToastProvider>
        </SessionProviderWrapper>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
