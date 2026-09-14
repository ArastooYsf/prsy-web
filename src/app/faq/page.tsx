import type { Metadata } from "next";
import FAQ from "@/components/FAQ";
import { getFaqItems } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description:
    "پاسخ به پرسش‌های رایج درباره پروژه‌ها، زمان تحویل، گارانتی، خدمات پس از فروش و نحوه همکاری با پویش راه صنعت یاشار.",
};

export default async function FAQPage() {
  const faqItems = await getFaqItems();
  return <FAQ items={faqItems} full />;
}
