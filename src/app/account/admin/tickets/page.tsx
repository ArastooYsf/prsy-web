import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TICKET_STATUS } from "@/lib/status-labels";
import DeleteEntityButton from "@/components/admin/DeleteEntityButton";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const tickets = await prisma.ticket.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { user: true },
  });

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">تیکت‌های پشتیبانی</h2>

      {tickets.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز تیکتی ثبت نشده است.
        </p>
      ) : (
        <div className="rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="text-foreground/60">
              <tr>
                <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">موضوع</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">مشتری</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">آخرین بروزرسانی</th>
                <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/account/admin/tickets/${ticket.id}`} className="hover:text-accent-400">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{ticket.user.name || ticket.user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${TICKET_STATUS[ticket.status].className}`}
                    >
                      {TICKET_STATUS[ticket.status].label}
                    </span>
                  </td>
                  <td dir="ltr" className="px-4 py-3 text-right text-foreground/60">
                    {ticket.updatedAt.toLocaleDateString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteEntityButton
                      endpoint={`/api/admin/tickets/${ticket.id}`}
                      title="حذف تیکت"
                      message={`مطمئنید می‌خواهید تیکت «${ticket.subject}» را حذف کنید؟`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
