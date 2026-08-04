import type { Metadata } from "next";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "سوالات متداول",
  description:
    "پاسخ به پرسش‌های رایج درباره پروژه‌ها، زمان تحویل، گارانتی، خدمات پس از فروش و نحوه همکاری با پویش راه صنعت یاشار.",
};

export default function FAQPage() {
  return <FAQ full />;
}
