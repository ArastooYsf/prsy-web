import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { authOptions } from "@/lib/auth";
import { getSiteLogo } from "@/lib/site-content";
import { getMediaUrl } from "@/lib/media";
import RegisterForm from "@/components/RegisterForm";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

export const metadata: Metadata = {
  title: "ثبت‌نام",
  description: "ساخت حساب کاربری در پویش راه صنعت یاشار.",
  robots: { index: false, follow: false },
};

// Deliberately bypasses the site's Header/Footer (hidden for this route in
// Header.tsx/Footer.tsx, same mechanism as /account) and renders its own
// logo-only header instead of reusing the full nav+search Header — a
// multi-step signup wizard works best with nothing else on the page to
// click away to.
export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/account");
  }

  const { logo } = await getSiteLogo();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-14 items-center">
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-base font-bold transition-transform duration-300 hover:scale-[1.03]">
          {logo ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              <Image src={getMediaUrl(logo)} alt="" fill sizes="32px" className="object-contain" />
            </span>
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-bold text-brand-950 shadow-md shadow-accent-500/20">
              یا
            </span>
          )}
          <span className="hidden sm:inline-block">
            پویش راه صنعت<span className="text-accent-400"> یاشار</span>
          </span>
        </Link>
      </header>

      <section className="relative flex flex-1 items-center overflow-hidden py-10">
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
    </div>
  );
}
