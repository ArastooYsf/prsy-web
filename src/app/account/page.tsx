import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center overflow-hidden py-16 lg:min-h-[calc(100vh-3rem)]">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />

      <div className="container relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="text-center">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              حساب کاربری
            </span>
            <h1 className="text-balance text-2xl font-black leading-tight sm:text-3xl">
              خوش آمدید، <span className="text-gradient">{session.user.name || session.user.email}</span>
            </h1>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div>
              <p className="text-xs font-medium text-foreground/50">ایمیل</p>
              <p dir="ltr" className="mt-1 text-left text-sm text-foreground">
                {session.user.email}
              </p>
            </div>
            <div className="pt-2">
              <SignOutButton callbackUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
