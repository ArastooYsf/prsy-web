import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ContractForm from "@/components/admin/ContractForm";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminContractDetailPage({ params }: { params: { id: string } }) {
  const contract = await prisma.contract.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { user: true },
  });

  if (!contract) {
    notFound();
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">ویرایش قرارداد</h2>
        <DeleteEntityButton
          endpoint={`/api/admin/contracts/${contract.id}`}
          title="حذف قرارداد"
          message={`مطمئنید می‌خواهید قرارداد «${contract.title}» را حذف کنید؟`}
          redirectTo="/account/admin/contracts"
        />
      </div>
      <div className="mx-auto max-w-xl">
        <ContractForm
          mode="edit"
          customers={customers.map((c) => ({ id: c.id, label: c.name ? `${c.name} (${c.email})` : c.email }))}
          contract={{
            id: contract.id,
            userId: contract.userId,
            title: contract.title,
            type: contract.type,
            startDate: contract.startDate.toISOString(),
            endDate: contract.endDate.toISOString(),
            status: contract.status,
            fileUrl: contract.fileUrl,
          }}
        />
      </div>
    </div>
  );
}
