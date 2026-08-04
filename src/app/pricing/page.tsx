import type { Metadata } from "next";
import Pricing from "@/components/Pricing";

export const metadata: Metadata = {
  title: "همکاری با ما",
  description:
    "شرایط همکاری متناسب با نیاز پروژه شما؛ از مشاوره و امکان‌سنجی تا اجرای کامل پروژه. برای استعلام قیمت با ما در ارتباط باشید.",
};

export default function PricingPage() {
  return <Pricing />;
}
