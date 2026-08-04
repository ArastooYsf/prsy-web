import type { Metadata } from "next";
import Pricing from "@/components/Pricing";

export const metadata: Metadata = {
  title: "قیمت‌گذاری و درخواست مشاوره",
  description:
    "بسته‌های همکاری متناسب با نیاز پروژه شما؛ از مشاوره و امکان‌سنجی تا اجرای کامل پروژه.",
};

export default function PricingPage() {
  return <Pricing />;
}
