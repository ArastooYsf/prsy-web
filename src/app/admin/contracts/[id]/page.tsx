import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import ContractForm from "@/components/admin/ContractForm";

export const dynamic = "force-dynamic";

export default async function AdminContractDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!contract) {
    notFound();
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{contract.title}</h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
          >
            {CONTRACT_STATUS[contract.status].label}
          </span>
        </div>
        <p className="text-sm text-foreground/70">مشتری: {contract.user.name || contract.user.email}</p>
        <p className="text-sm text-foreground/70">نوع: {contract.type}</p>
        <p dir="ltr" className="text-left text-sm text-foreground/70">
          {contract.startDate.toLocaleDateString("fa-IR")} — {contract.endDate.toLocaleDateString("fa-IR")}
        </p>
        {contract.fileUrl && (
          <a
            href={getMediaUrl(contract.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            دانلود PDF
          </a>
        )}
      </div>
    );
  }

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ویرایش قرارداد</h2>
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
