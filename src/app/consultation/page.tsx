import type { Metadata } from "next";
import ConsultationForm from "@/components/ConsultationForm";

export const metadata: Metadata = {
  title: "درخواست مشاوره",
  description:
    "فرم درخواست مشاوره رایگان برای پروژه دیزل ژنراتور یا صنعتی شما؛ کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس می‌گیرند.",
};

export default function ConsultationPage() {
  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            درخواست مشاوره
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
            مشاوره رایگان <span className="text-accent-soft">برای پروژه شما</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance leading-7 text-foreground/70">
            فرم زیر را پر کنید؛ کارشناسان ما ظرف ۴۸ ساعت کاری با شما تماس
            می‌گیرند تا جلسه ارزیابی اولیه هماهنگ شود.
          </p>
        </div>
      </section>

      <section className="relative pb-20 pt-4 sm:pb-28">
        <div className="container">
          <ConsultationForm />
        </div>
      </section>
    </>
  );
}
