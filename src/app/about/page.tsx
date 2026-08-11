import type { Metadata } from "next";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "پویش راه صنعت یاشار، از سال ۱۳۹۶ تأمین‌کننده دیزل ژنراتور، موتور برق و قطعات یدکی با بالاترین کیفیت، بهترین قیمت و سریع‌ترین تحویل.",
};

export default function AboutPage() {
  return <About />;
}
