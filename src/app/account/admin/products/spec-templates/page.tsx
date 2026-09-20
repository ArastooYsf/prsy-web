import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, ListChecks } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getSpecTemplates } from "@/lib/site-content";
import SpecTemplatesForm from "@/components/admin/SpecTemplatesForm";

export const dynamic = "force-dynamic";

export default async function SpecTemplatesAdminPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const templates = await getSpecTemplates();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ListChecks className="size-5 text-accent-400" />
          مشخصات پیش‌فرض محصولات
        </h2>
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>
      <p className="mb-6 text-sm text-foreground/60">
        این ردیف‌ها در فرم محصول برای هر دسته‌بندی از پیش نمایش داده می‌شن. ترتیب اینجا همان ترتیب فرم و صفحه‌ی محصول است.
      </p>
      <SpecTemplatesForm initialTemplates={templates} />
    </div>
  );
}
