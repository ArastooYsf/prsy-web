import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import Footer from "@/components/layout/Footer";
import PageLoader from "@/components/PageLoader";
import PageViewTracker from "@/components/PageViewTracker";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import OfflineBanner from "@/components/OfflineBanner";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import ToastProvider from "@/components/ToastProvider";
import { getFooterContact, getFooterEditableContent, getHeaderNavLabels, getSiteLogo, getDownloadsContent, getTrustSeals } from "@/lib/site-content";
import { getMenuTaxonomy } from "@/lib/menu-taxonomy";
import RouteThemeScope, { type SiteTheme } from "@/components/RouteThemeScope";
import CartProvider from "@/components/CartProvider";
import { OverlayCoordinatorProvider } from "@/components/OverlayCoordinator";
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
  const [footerContact, menuTaxonomy, footerContent, headerNavLabels, siteLogo, downloads, trustSeals, session] = await Promise.all([
    getFooterContact(),
    getMenuTaxonomy(),
    getFooterEditableContent(),
    getHeaderNavLabels(),
    getSiteLogo(),
    getDownloadsContent(),
    getTrustSeals(),
    getServerSession(authOptions),
  ]);

  // Resolved server-side so the very first response already has the right
  // theme baked in — no post-hydration flip for anyone who has a stored
  // choice. A signed-in account's choice (synced to every device) always
  // wins over this browser's own cookie; a signed-out visitor's cookie is
  // the only signal available. `null` means neither exists yet (a genuinely
  // first-time, signed-out visitor), left for the client to resolve from
  // prefers-color-scheme via the beforeInteractive script below.
  let initialTheme: SiteTheme | null = null;
  if (session?.user?.id) {
    const account = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { themeLight: true },
    });
    if (account && account.themeLight !== null) initialTheme = account.themeLight ? "light" : "dark";
  } else {
    const cookieTheme = cookies().get("theme")?.value;
    if (cookieTheme === "light" || cookieTheme === "dark") initialTheme = cookieTheme;
  }

  return (
    <html
      lang="fa"
      dir="rtl"
      className={cn(shabnamFD.variable, vazirmatn.variable, initialTheme === "light" && "theme-white-blue")}
      suppressHydrationWarning
    >
      <head>
        {/* Only needed when the server had no stored preference to render
            directly (see initialTheme above) — a signed-in account's choice
            or a returning guest's cookie already produced the right <html>
            class server-side, so this never even ships for them. Runs
            synchronously before <body> exists, exactly like the loader-skip
            script below, so the very first paint already matches the OS
            setting instead of flashing the dark default and correcting
            itself once React hydrates. */}
        {initialTheme === null && (
          <script
            id="theme-detect"
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.classList.add('theme-white-blue');
                  }
                } catch (e) {}
              `,
            }}
          />
        )}
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
        <RouteThemeScope initialTheme={initialTheme} isLoggedIn={!!session?.user}>
          <OverlayCoordinatorProvider>
            <ScrollProgress />
            {GA_MEASUREMENT_ID && <AnalyticsScripts measurementId={GA_MEASUREMENT_ID} />}
            <SessionProviderWrapper>
              <ToastProvider>
                <CartProvider>
                  <SkeletonTheme
                    baseColor="rgb(var(--foreground) / 0.06)"
                    highlightColor="rgba(249,146,63,0.12)"
                    borderRadius="0.5rem"
                    direction="rtl"
                    inline
                  >
                    <PageViewTracker />
                    <PageLoader />
                    <Header menuCategories={menuTaxonomy.categories} navLabels={headerNavLabels} logo={siteLogo.logo} />
                    <main>{children}</main>
                    <Footer contact={footerContact} content={footerContent} logo={siteLogo.logo} downloads={downloads} trustSeals={trustSeals} />
                  </SkeletonTheme>
                </CartProvider>
              </ToastProvider>
            </SessionProviderWrapper>
            <CookieConsentBanner />
            <OfflineBanner />
          </OverlayCoordinatorProvider>
        </RouteThemeScope>
      </body>
    </html>
  );
}
