import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Tag } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BrandManager from "@/components/admin/BrandManager";

export const dynamic = "force-dynamic";

export default async function BrandsAdminPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") redirect("/account/admin");

  const brands = await prisma.brand.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Tag className="size-5 text-accent-400" />
          برندها
        </h2>
        <Link
          href="/account/admin/products"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-sm font-medium text-foreground/70 transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          <ArrowRight className="size-4" />
          بازگشت به محصولات
        </Link>
      </div>
      <BrandManager brands={brands} />
    </div>
  );
}
