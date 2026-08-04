import type { Metadata } from "next";
import About from "@/components/About";
import { getAboutContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "پویش راه صنعت یاشار، از سال ۱۳۹۶ تأمین‌کننده دیزل ژنراتور، موتور برق و قطعات یدکی با بالاترین کیفیت، بهترین قیمت و سریع‌ترین تحویل.",
};

export default async function AboutPage() {
  const { title, body } = await getAboutContent();
  return <About title={title} body={body} />;
}
