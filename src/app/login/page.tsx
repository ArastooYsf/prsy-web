import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "ورود",
  description: "ورود به حساب کاربری در پویش راه صنعت یاشار.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/account");
  }

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-16 lg:min-h-[calc(100vh-3rem)]">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-accent-500/15 blur-[110px]"
      />

      <div className="container relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              حساب کاربری
            </span>
            <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
              ورود به <span className="text-gradient">حساب کاربری</span>
            </h1>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
            <p className="mt-5 text-center text-sm text-foreground/60">
              حساب کاربری ندارید؟{" "}
              <Link href="/register" className="font-semibold text-accent-400">
                ثبت‌نام
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
