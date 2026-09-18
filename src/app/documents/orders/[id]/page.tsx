import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrderDocumentData, OrderNotFoundError } from "@/lib/documents/order-document";
import DocumentPageShell from "@/components/documents/DocumentPageShell";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function OrderDocumentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/documents/orders/${params.id}`)}`);
  }

  let data;
  try {
    data = await getOrderDocumentData(params.id);
  } catch (err) {
    if (err instanceof OrderNotFoundError) notFound();
    throw err;
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff) {
    const { prisma } = await import("@/lib/prisma");
    const orderOwner = await prisma.order.findUnique({ where: { id: params.id }, select: { userId: true } });
    if (orderOwner?.userId !== session.user.id) {
      notFound();
    }
  }

  const { company, customer, order, items, issuedAtJalali } = data;

  return (
    <DocumentPageShell pdfHref={`/api/admin/orders/${params.id}/pdf`}>
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
          <div className="text-xl font-bold">فاکتور سفارش</div>
          <p className="mt-1.5 text-xs text-slate-500">
            شماره سفارش: {order.orderNumber}
            <br />
            تاریخ ثبت: {order.createdAtJalali}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2.5 text-xs font-bold text-blue-700">مشخصات مشتری</h3>
          <dl className="space-y-1.5 text-xs">
            <div><dt className="inline text-slate-500">نام: </dt><dd className="inline">{customer.name}</dd></div>
            <div><dt className="inline text-slate-500">تلفن: </dt><dd className="inline">{customer.phone}</dd></div>
            {customer.companyName && (
              <div><dt className="inline text-slate-500">شرکت: </dt><dd className="inline">{customer.companyName}</dd></div>
            )}
            {customer.address && (
              <div><dt className="inline text-slate-500">آدرس: </dt><dd className="inline">{customer.address}</dd></div>
            )}
          </dl>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="mb-2.5 text-xs font-bold text-blue-700">مشخصات سفارش</h3>
          <dl className="space-y-1.5 text-xs">
            <div><dt className="inline text-slate-500">شماره سفارش: </dt><dd className="inline" dir="ltr">{order.orderNumber}</dd></div>
            <div><dt className="inline text-slate-500">تعداد اقلام: </dt><dd className="inline">{order.itemCount}</dd></div>
            <div>
              <dt className="inline text-slate-500">وضعیت: </dt>
              <dd
                className="inline rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: order.statusColorBg, color: order.statusColorText }}
              >
                {order.statusLabel}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-slate-600">
            <th className="border border-slate-200 px-2.5 py-2 font-bold">ردیف</th>
            <th className="border border-slate-200 px-2.5 py-2 font-bold">شرح کالا / خدمات</th>
            <th className="border border-slate-200 px-2.5 py-2 font-bold">تعداد</th>
            <th className="border border-slate-200 px-2.5 py-2 font-bold">قیمت واحد (تومان)</th>
            <th className="border border-slate-200 px-2.5 py-2 font-bold">قیمت کل (تومان)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td dir="ltr" className="border border-slate-200 px-2.5 py-2 text-left">{item.row}</td>
              <td className="border border-slate-200 px-2.5 py-2">
                {item.name}
                {item.isCatalog && (
                  <span className="mr-1.5 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                    کاتالوگ
                  </span>
                )}
              </td>
              <td dir="ltr" className="border border-slate-200 px-2.5 py-2 text-left">{item.quantity}</td>
              <td dir="ltr" className="border border-slate-200 px-2.5 py-2 text-left">{item.unitPriceFormatted}</td>
              <td dir="ltr" className="border border-slate-200 px-2.5 py-2 text-left">{item.lineTotalFormatted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2.5 flex justify-start border-t-2 border-blue-700 pt-2.5 text-base font-bold">
        جمع کل: {order.grandTotalFormatted} تومان
      </div>

      <div className="mt-8 border-t border-slate-200 pt-2.5 text-center text-[10px] text-slate-400">
        این سند به‌صورت خودکار در تاریخ {issuedAtJalali} توسط سامانه {company.name} تولید شده است و به‌منزله‌ی فاکتور رسمی می‌باشد.
      </div>
    </DocumentPageShell>
  );
}
