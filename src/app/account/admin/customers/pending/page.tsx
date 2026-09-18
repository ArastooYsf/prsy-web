import type { Metadata } from "next";
import Link from "next/link";
import { ShieldQuestion } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import RetryNationalIdInquiry from "@/components/admin/RetryNationalIdInquiry";
import { LEGAL_CUSTOMER_NEEDS_REVIEW_WHERE } from "@/lib/national-id-verification";

export const metadata: Metadata = {
  title: "اشخاص حقوقی نیازمند بررسی دستی",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Advisory only — these accounts are already active (customerType LEGAL is
// never login-blocked anymore, see src/app/api/auth/register/route.ts).
// Two distinct reasons land a LEGAL customer here, both purely advisory:
//   - nationalIdVerified: false — the last automatic api.ir inquiry didn't
//     succeed (invalid ID at the time, service unreachable, or never
//     checked at all).
//   - nationalIdVerified: true but nationalIdActive: false — api.ir found
//     the company, but it's registered as dissolved/inactive.
// Either way, nothing here can lock a customer out — an admin can look them
// up, retry the same inquiry, or investigate manually.
export default async function LegalEntitiesNeedingReviewPage() {
  const needsReview = await prisma.user.findMany({
    where: LEGAL_CUSTOMER_NEEDS_REVIEW_WHERE,
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
        <ShieldQuestion className="size-5 text-accent-400" />
        اشخاص حقوقی نیازمند بررسی دستی
      </h2>
      <p className="mb-6 text-sm text-foreground/60">
        این حساب‌ها یا استعلام خودکار شناسه ملی‌شان (از api.ir) موفق نبوده، یا موفق بوده اما شرکت طبق ثبت رسمی
        غیرفعال/منحل‌شده گزارش شده. این حساب‌ها مسدود نیستند و کاربر می‌تواند وارد شود؛ این فهرست فقط برای بررسی دستی
        اختیاری شماست.
      </p>

      {needsReview.length === 0 ? (
        <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center text-sm text-foreground/60">
          همه‌ی اشخاص حقوقی با موفقیت و به‌صورت فعال استعلام شده‌اند.
        </p>
      ) : (
        <div className="space-y-3">
          {needsReview.map((customer) => (
            <div
              key={customer.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
            >
              <Link href={`/account/admin/customers/${customer.id}`} className="min-w-0 flex-1 hover:opacity-80">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{customer.companyName || customer.name || customer.email}</p>
                  {customer.nationalIdVerified && customer.nationalIdActive === false && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                      غیرفعال/منحل‌شده
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-foreground/50">
                  {customer.name} · <span dir="ltr">{customer.email}</span>
                </p>
                {customer.nationalId && (
                  <p className="mt-1 text-xs text-foreground/50">
                    شناسه ملی: <span dir="ltr">{customer.nationalId}</span>
                    {customer.nationalIdOfficialName && ` — نام رسمی: ${customer.nationalIdOfficialName}`}
                  </p>
                )}
                <p className="mt-1 text-xs text-foreground/40">
                  ثبت‌نام: <span dir="ltr">{formatJalali(customer.createdAt.toISOString())}</span>
                  {customer.nationalIdCheckedAt && (
                    <>
                      {" "}
                      · آخرین تلاش استعلام: <span dir="ltr">{formatJalali(customer.nationalIdCheckedAt.toISOString())}</span>
                    </>
                  )}
                </p>
              </Link>
              {customer.nationalId && <RetryNationalIdInquiry customerId={customer.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
