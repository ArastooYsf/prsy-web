import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در پویش راه صنعت یاشار.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/account");
  }

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-16 lg:min-h-[calc(100vh-3rem)]">
      <ThemedGridBackdrop />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full bg-accent-500/8 blur-[110px]"
      />

      <div className="container relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              حساب کاربری
            </span>
            <h1 className="text-balance text-2xl font-bold leading-tight sm:text-3xl">
              ساخت <span className="text-accent-soft">حساب کاربری</span>
            </h1>
          </div>

          <div className="mt-8 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
            <RegisterForm />
            <p className="mt-5 text-center text-sm text-foreground/60">
              قبلاً حساب دارید؟{" "}
              <Link href="/login" className="font-semibold text-accent-400">
                ورود
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
