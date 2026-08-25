import { getServerSession } from "next-auth";
import { FileText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import DateRangeDisplay from "@/components/DateRangeDisplay";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AccountContractsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const contracts = await prisma.contract.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <FileText className="size-5 text-accent-400" />
        قراردادها
      </h2>

      {contracts.length === 0 ? (
        <p className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز قراردادی برای شما ثبت نشده است.
        </p>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const daysLeft = Math.ceil((contract.endDate.getTime() - now) / DAY_MS);
            const expiringSoon = contract.status === "ACTIVE" && daysLeft >= 0 && daysLeft <= 30;

            return (
              <div
                key={contract.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
              >
                <div>
                  <p className="font-semibold">{contract.title}</p>
                  <p className="mt-1 text-xs text-foreground/50">{contract.type}</p>
                  <DateRangeDisplay
                    start={contract.startDate.toISOString()}
                    end={contract.endDate.toISOString()}
                    className="mt-1 text-xs text-foreground/50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {expiringSoon && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400">
                      رو به پایان ({formatNumber(daysLeft)} روز)
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CONTRACT_STATUS[contract.status].className}`}
                  >
                    {CONTRACT_STATUS[contract.status].label}
                  </span>
                  {contract.fileUrl && (
                    <a
                      href={getMediaUrl(contract.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                    >
                      <FileTypeIcon kind={fileKindFromName(contract.fileUrl)} />
                      دانلود پیوست
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
