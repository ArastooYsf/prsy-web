import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTRACT_STATUS } from "@/lib/status-labels";

export const dynamic = "force-dynamic";

export default async function AdminContractsPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold">قراردادها</h2>
        {isAdmin && (
          <Link
            href="/admin/contracts/new"
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
          >
            ثبت قرارداد جدید
          </Link>
        )}
      </div>

      {contracts.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز قراردادی ثبت نشده است.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-foreground/60">
              <tr>
                <th className="px-4 py-3 text-right font-medium">عنوان</th>
                <th className="px-4 py-3 text-right font-medium">مشتری</th>
                <th className="px-4 py-3 text-right font-medium">نوع</th>
                <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{contract.title}</td>
                  <td className="px-4 py-3 text-foreground/70">{contract.user.name || contract.user.email}</td>
                  <td className="px-4 py-3 text-foreground/70">{contract.type}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
                    >
                      {CONTRACT_STATUS[contract.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-left">
                    <Link
                      href={`/admin/contracts/${contract.id}`}
                      className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                    >
                      {isAdmin ? "ویرایش" : "مشاهده"}
                    </Link>
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
