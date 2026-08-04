import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { Header } from "@/components/ui/header-2";
import Footer from "@/components/Footer";
import "./globals.css";

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
  themeColor: "#20242A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
