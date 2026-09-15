import Link from "next/link";
import { getServerSession } from "next-auth";
import { FileText, Plus, Ban } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { CONTRACT_STATUS } from "@/lib/status-labels";
import { formatNumber } from "@/lib/format-number";
import DateRangeDisplay from "@/components/DateRangeDisplay";
import { FileTypeIcon, fileKindFromName } from "@/components/FileTypeIcon";
import StatusBadge from "@/components/ui/StatusBadge";
import { debugSlowLoad } from "@/lib/debug-slow-load";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function newContractTicketHref() {
  const subject = "درخواست قرارداد جدید";
  const message = "با سلام،\nدرخواست عقد یک قرارداد جدید را دارم. لطفاً برای هماهنگی جزئیات با من تماس بگیرید.";
  return `/account/tickets/new?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
}

function cancelContractTicketHref(contract: { title: string; type: string }) {
  const subject = "درخواست لغو قرارداد";
  const message = `با سلام،\nدرخواست لغو قرارداد «${contract.title}» (نوع: ${contract.type}) را دارم. لطفاً بررسی و پیگیری کنید.`;
  return `/account/tickets/new?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
}

export default async function AccountContractsPage() {
  await debugSlowLoad();

  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const contracts = await prisma.contract.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <FileText className="size-5 text-accent-400" />
          قراردادها
        </h2>
        <Link
          href={newContractTicketHref()}
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          درخواست قرارداد جدید
        </Link>
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="هنوز قراردادی برای شما ثبت نشده است."
          description="وقتی تیم ما قراردادی براتون ثبت کنه، همین‌جا نمایش داده می‌شه."
        />
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
                  <StatusBadge status={CONTRACT_STATUS[contract.status]} />
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
                  {(contract.status === "ACTIVE" || contract.status === "RENEWING") && (
                    <Link
                      href={cancelContractTicketHref(contract)}
                      className="flex min-h-11 items-center gap-1.5 rounded-full border border-red-500/30 px-4 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      <Ban className="size-3.5" />
                      لغو قرارداد
                    </Link>
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
