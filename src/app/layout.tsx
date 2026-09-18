import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { Header } from "@/components/ui/header-2";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import Footer from "@/components/Footer";
import PageLoader from "@/components/PageLoader";
import PageViewTracker from "@/components/PageViewTracker";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import OfflineBanner from "@/components/OfflineBanner";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import ToastProvider from "@/components/ToastProvider";
import { getFooterContact, getFooterEditableContent, getHeaderNavLabels } from "@/lib/site-content";
import { getMenuTaxonomy } from "@/lib/menu-taxonomy";
import RouteThemeScope from "@/components/RouteThemeScope";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Primary face. Self-hosted via next/font/local (build-time fingerprint +
// automatic <link rel=preload> for the first weight), only the four weights
// the site actually uses. SIL OFL — see src/fonts/shabnam-fd/LICENSE.
const shabnamFD = localFont({
  src: [
    { path: "../fonts/shabnam-fd/Shabnam-Light-FD.woff2", weight: "300", style: "normal" },
    { path: "../fonts/shabnam-fd/Shabnam-FD.woff2", weight: "400", style: "normal" },
    { path: "../fonts/shabnam-fd/Shabnam-Medium-FD.woff2", weight: "500", style: "normal" },
    { path: "../fonts/shabnam-fd/Shabnam-Bold-FD.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-shabnam",
  display: "swap",
});

// Kept only as the font-display: swap fallback in the font-sans stack (see
// tailwind.config.ts) — a real Persian face to paint while Shabnam loads,
// not the browser's generic sans. preload: false because it's never the
// face that actually renders, so it shouldn't compete for startup priority.
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: false,
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
  twitter: {
    card: "summary",
    title: "پویش راه صنعت یاشار",
    description:
      "تأمین‌کننده دیزل ژنراتور، موتور برق، قطعات یدکی و خدمات اورهال؛ نو و دست‌دوم.",
  },
};

// Only facts confirmed real in PRODUCT.md (registration number, founding
// year, name/url) — the placeholder phone number, stats, and testimonials
// noted there must never be promoted into structured data search engines
// treat as verified fact.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "پویش راه صنعت یاشار",
  alternateName: "Yashar Industrial Route Development",
  url: "https://yasharindustry.com",
  description:
    "پویش راه صنعت یاشار، تأمین‌کننده دیزل ژنراتور، موتور برق، قطعات یدکی و خدمات اورهال با برندهای معتبر جهانی؛ به‌صورت نو و دست‌دوم.",
  foundingDate: "2017",
  identifier: {
    "@type": "PropertyValue",
    name: "شماره ثبت شرکت",
    value: "47606",
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
  const [footerContact, menuTaxonomy, footerContent, headerNavLabels] = await Promise.all([
    getFooterContact(),
    getMenuTaxonomy(),
    getFooterEditableContent(),
    getHeaderNavLabels(),
  ]);

  return (
    <html lang="fa" dir="rtl" className={`${shabnamFD.variable} ${vazirmatn.variable}`} suppressHydrationWarning>
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
        <script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <RouteThemeScope>
          <ScrollProgress />
          {GA_MEASUREMENT_ID && <AnalyticsScripts measurementId={GA_MEASUREMENT_ID} />}
          <SessionProviderWrapper>
            <ToastProvider>
              <SkeletonTheme
                baseColor="rgb(var(--foreground) / 0.06)"
                highlightColor="rgba(249,146,63,0.12)"
                borderRadius="0.5rem"
                direction="rtl"
                inline
              >
                <PageViewTracker />
                <PageLoader />
                <Header menuCategories={menuTaxonomy.categories} navLabels={headerNavLabels} />
                <main>{children}</main>
                <Footer contact={footerContact} content={footerContent} />
              </SkeletonTheme>
            </ToastProvider>
          </SessionProviderWrapper>
          <CookieConsentBanner />
          <OfflineBanner />
        </RouteThemeScope>
      </body>
    </html>
  );
}
