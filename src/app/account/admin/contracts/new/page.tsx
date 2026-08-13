import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ContractForm from "@/components/admin/ContractForm";

export const metadata: Metadata = {
  title: "ثبت قرارداد جدید",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewContractPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin/contracts");
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ثبت قرارداد جدید</h2>
      <div className="mx-auto max-w-xl">
        <ContractForm
          mode="create"
          customers={customers.map((c) => ({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email }))}
        />
      </div>
    </div>
  );
}
