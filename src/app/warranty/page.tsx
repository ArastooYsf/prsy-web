import type { Metadata } from "next";
import Link from "next/link";
import { getLegalPageMeta } from "@/lib/site-content";
import { formatJalaliMonthYear } from "@/lib/jalali";
import ThemedProse from "@/components/ui/ThemedProse";

export const metadata: Metadata = {
  title: "گارانتی و پشتیبانی",
  description: "شرایط کلی گارانتی، خدمات پس از فروش و پشتیبانی محصولات پویش راه صنعت یاشار.",
};

export default async function WarrantyPage() {
  const { html, heading, updatedAt } = await getLegalPageMeta("warranty");

  return (
    <section className="relative pb-20 pt-24 sm:pb-28 sm:pt-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold text-accent-400">{heading.eyebrow}</span>
          <h1 className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">{heading.heading}</h1>
          {updatedAt && <p className="mt-4 leading-7 text-foreground/70">آخرین به‌روزرسانی: {formatJalaliMonthYear(updatedAt)}</p>}
        </div>

        <ThemedProse
          html={html}
          className="prose prose-sm mx-auto mt-14 max-w-3xl leading-7 sm:prose-base [&_a]:text-accent-400 [&_strong]:text-foreground"
        />

        <p className="mx-auto mt-10 max-w-3xl text-center leading-7 text-foreground/70">
          برای ثبت درخواست گارانتی یا پشتیبانی، از طریق{" "}
          <Link href="/contact" className="font-semibold text-accent-400 transition-colors hover:text-foreground">
            صفحه تماس با ما
          </Link>{" "}
          یا تیکت پشتیبانی در حساب کاربری خود اقدام کنید.
        </p>
      </div>
    </section>
  );
}
