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
import { getFooterContact, getProductCategories } from "@/lib/site-content";
import RouteThemeScope from "@/components/RouteThemeScope";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
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
  const [footerContact, productCategories] = await Promise.all([getFooterContact(), getProductCategories()]);

  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <head>
        {/* A plain <script> here (NOT next/script) is required: next/script's
            beforeInteractive strategy still ships its body through Next's RSC
            flight payload and only runs once Next's own runtime chunk has
            parsed it — measured at ~500ms locally, well after first paint.
            This tag is emitted as literal HTML and the browser executes it
            synchronously while parsing <head>, before <body> (and the splash
            div in it) is even parsed — the same reason theme-flash-prevention
            scripts are written this way. Without it, a repeat hard
            navigation/refresh in the same tab would paint the splash for a
            few hundred ms and cover the route's own loading.tsx skeleton
            before disappearing, instead of skipping it entirely. */}
        <script
          id="page-loader-skip"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (sessionStorage.getItem('yashar:pageLoaderShown') === '1') {
                  document.documentElement.classList.add('pl-skip');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <RouteThemeScope>
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
              <SkeletonTheme
                baseColor="rgba(255,255,255,0.06)"
                highlightColor="rgba(249,146,63,0.12)"
                borderRadius="0.5rem"
                direction="rtl"
                inline
              >
                <PageViewTracker />
                <PageLoader />
                <Header productCategories={productCategories} />
                <main>{children}</main>
                <Footer contact={footerContact} />
              </SkeletonTheme>
            </ToastProvider>
          </SessionProviderWrapper>
          <CookieConsentBanner />
        </RouteThemeScope>
      </body>
    </html>
  );
}
