import type { Metadata } from "next";
import Link from "next/link";
import { getLegalPageHtml } from "@/lib/site-content";
import ThemedProse from "@/components/ui/ThemedProse";

export const metadata: Metadata = {
  title: "قوانین و مقررات",
  description: "قوانین و مقررات استفاده از خدمات و محصولات پویش راه صنعت یاشار.",
};

export default async function TermsPage() {
  const html = await getLegalPageHtml("terms");

  return (
    <section className="relative pb-20 pt-24 sm:pb-28 sm:pt-28">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold text-accent-400">
            قوانین و مقررات
          </span>
          <h1 className="mt-3 text-balance text-3xl font-bold leading-tight sm:text-4xl">
            قوانین و مقررات استفاده از خدمات
          </h1>
          <p className="mt-4 leading-7 text-foreground/70">
            آخرین به‌روزرسانی: مرداد ۱۴۰۵
          </p>
        </div>

        <ThemedProse
          html={html}
          className="prose prose-sm mx-auto mt-14 max-w-3xl leading-7 sm:prose-base [&_a]:text-accent-400 [&_strong]:text-foreground"
        />

        <p className="mx-auto mt-14 max-w-3xl text-center leading-7 text-foreground/70">
          برای هرگونه سوال درباره این قوانین، از طریق{" "}
          <Link
            href="/contact"
            className="font-semibold text-accent-400 transition-colors hover:text-foreground"
          >
            صفحه تماس با ما
          </Link>{" "}
          با ما در ارتباط باشید.
        </p>
      </div>
    </section>
  );
}
