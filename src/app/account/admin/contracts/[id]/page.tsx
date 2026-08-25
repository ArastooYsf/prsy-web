import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import ContractForm from "@/components/admin/ContractForm";
import DateRangeDisplay from "@/components/DateRangeDisplay";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminContractDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const contract = await prisma.contract.findFirst({
    where: { id: params.id, deletedAt: null },
    include: { user: true },
  });

  if (!contract) {
    notFound();
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 sm:p-8">
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
        <DateRangeDisplay
          start={contract.startDate.toISOString()}
          end={contract.endDate.toISOString()}
          className="text-sm text-foreground/70"
        />
        {contract.fileUrl && (
          <a
            href={getMediaUrl(contract.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
          >
            <FileTypeIcon kind={fileKindFromName(contract.fileUrl)} />
            دانلود پیوست
          </a>
        )}
      </div>
    );
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
