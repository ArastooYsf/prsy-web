import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import CustomerApprovalActions from "@/components/admin/CustomerApprovalActions";

export const metadata: Metadata = {
  title: "درخواست‌های تأیید مشتری حقوقی",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PendingCustomersPage() {
  const pending = await prisma.user.findMany({
    where: { role: "CUSTOMER", approvalStatus: "PENDING", deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold">درخواست‌های تأیید مشتری حقوقی</h2>
      <p className="mb-6 text-sm text-foreground/60">
        این حساب‌ها به‌عنوان مشتری حقوقی ثبت‌نام کرده‌اند و تا زمان تأیید نمی‌توانند وارد شوند.
      </p>

      {pending.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          درخواست در انتظار تأییدی وجود ندارد.
        </p>
      ) : (
        <div className="space-y-3">
          {pending.map((customer) => (
            <div
              key={customer.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div>
                <p className="font-semibold">{customer.companyName || customer.name || customer.email}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {customer.name} · <span dir="ltr">{customer.email}</span>
                </p>
                {customer.economicCode && (
                  <p className="mt-1 text-xs text-foreground/50">
                    کد اقتصادی: <span dir="ltr">{customer.economicCode}</span>
                  </p>
                )}
                <p className="mt-1 text-xs text-foreground/40">
                  ثبت‌نام: <span dir="ltr">{formatJalali(customer.createdAt.toISOString())}</span>
                </p>
              </div>
              <CustomerApprovalActions customerId={customer.id} customerLabel={customer.companyName || customer.email} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
