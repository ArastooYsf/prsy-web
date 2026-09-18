import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getContractDocumentData, ContractNotFoundError } from "@/lib/documents/contract-document";
import DocumentPageShell from "@/components/documents/DocumentPageShell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function ContractDocumentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/documents/contracts/${params.id}`)}`);
  }

  let data;
  try {
    data = await getContractDocumentData(params.id);
  } catch (err) {
    if (err instanceof ContractNotFoundError) notFound();
    throw err;
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff) {
    const { prisma } = await import("@/lib/prisma");
    const contractOwner = await prisma.contract.findUnique({ where: { id: params.id }, select: { userId: true } });
    if (contractOwner?.userId !== session.user.id) {
      notFound();
    }
  }

  const { company, customer, contract, issuedAtJalali } = data;

  return (
    <DocumentPageShell pdfHref={`/api/admin/contracts/${params.id}/pdf`}>
      <div className="flex items-start justify-between border-b-2 border-blue-700 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-blue-50">
              یا
            </span>
            <span className="text-lg font-bold">{company.name}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            شماره ثبت: {company.registrationNumber} | {company.address}
            <br />
            {company.phone} | {company.email}
          </p>
        </div>
        <div className="text-left">
          <div className="text-xl font-bold">قرارداد رسمی</div>
          <p className="mt-1.5 text-xs text-slate-500">
            شماره سند: {contract.id}
            <br />
            تاریخ صدور: {issuedAtJalali}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2.5 text-xs font-bold text-blue-700">مشخصات طرف قرارداد (مشتری)</h3>
          <dl className="space-y-1.5 text-xs">
            <div><dt className="inline text-slate-500">نام: </dt><dd className="inline">{customer.name}</dd></div>
            <div><dt className="inline text-slate-500">تلفن: </dt><dd className="inline">{customer.phone}</dd></div>
            {customer.companyName && (
              <div><dt className="inline text-slate-500">شرکت: </dt><dd className="inline">{customer.companyName}</dd></div>
            )}
            {customer.nationalId && (
              <div><dt className="inline text-slate-500">شناسه ملی: </dt><dd className="inline">{customer.nationalId}</dd></div>
            )}
            {customer.address && (
              <div><dt className="inline text-slate-500">آدرس: </dt><dd className="inline">{customer.address}</dd></div>
            )}
          </dl>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2.5 text-xs font-bold text-blue-700">مشخصات قرارداد</h3>
          <dl className="space-y-1.5 text-xs">
            <div><dt className="inline text-slate-500">موضوع: </dt><dd className="inline">{contract.title}</dd></div>
            <div><dt className="inline text-slate-500">نوع قرارداد: </dt><dd className="inline">{contract.type}</dd></div>
            <div><dt className="inline text-slate-500">تاریخ شروع: </dt><dd className="inline" dir="ltr">{contract.startDateJalali}</dd></div>
            <div><dt className="inline text-slate-500">تاریخ پایان: </dt><dd className="inline" dir="ltr">{contract.endDateJalali}</dd></div>
            <div>
              <dt className="inline text-slate-500">وضعیت: </dt>
              <dd
                className="inline rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: contract.statusColorBg, color: contract.statusColorText }}
              >
                {contract.statusLabel}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="my-5 rounded-lg bg-slate-50 p-4 text-sm leading-8">
        این سند گواهی می‌کند که قراردادی با موضوع «{contract.title}» از نوع «{contract.type}»، فی‌مابین شرکت {company.name} (شماره ثبت {company.registrationNumber}) به‌عنوان طرف اول، و {customer.name} به‌عنوان طرف دوم (مشتری)، منعقد گردیده است. مدت اعتبار این قرارداد از تاریخ {contract.startDateJalali} تا تاریخ {contract.endDateJalali} می‌باشد و طرفین متعهد به رعایت کامل مفاد آن هستند.
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 text-center">
        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">امضا و مهر شرکت ({company.name})</div>
        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">امضای مشتری ({customer.name})</div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-2.5 text-center text-[10px] text-slate-400">
        این سند به‌صورت خودکار در تاریخ {issuedAtJalali} توسط سامانه {company.name} تولید شده است.
      </div>
    </DocumentPageShell>
  );
}
