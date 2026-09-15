import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPE, APPROVAL_STATUS } from "@/lib/status-labels";
import StatusBadge from "@/components/ui/StatusBadge";
import CustomerFilesManager from "@/components/admin/CustomerFilesManager";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", deletedAt: null },
  });

  if (!customer) {
    notFound();
  }

  const files = await prisma.customerFile.findMany({
    where: { userId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{customer.name || customer.email}</h2>
            {customer.companyName && <p className="mt-1 text-sm text-foreground/50">{customer.companyName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={CUSTOMER_TYPE[customer.customerType]} />
            <StatusBadge status={APPROVAL_STATUS[customer.approvalStatus]} />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-foreground/40">ایمیل</dt>
            <dd dir="ltr" className="mt-0.5 text-right text-foreground/80">
              {customer.email}
            </dd>
          </div>
          <div>
            <dt className="text-foreground/40">تلفن</dt>
            <dd dir="ltr" className="mt-0.5 text-right text-foreground/80">
              {customer.phone || "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <FolderOpen className="size-4 text-accent-400" />
          فایل‌های مشتری
        </h3>

        <CustomerFilesManager
          customerId={customer.id}
          files={files.map((f) => ({
            id: f.id,
            title: f.title,
            url: f.url,
            mimeType: f.mimeType,
            size: f.size,
            createdAt: f.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
