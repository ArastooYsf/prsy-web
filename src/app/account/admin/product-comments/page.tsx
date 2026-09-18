import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { formatJalali } from "@/lib/jalali";
import { APPROVAL_STATUS } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";
import ProductCommentActions from "@/components/admin/ProductCommentActions";

export const metadata: Metadata = {
  title: "دیدگاه‌های محصولات",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

function isValidStatus(value: string | undefined): value is (typeof STATUS_FILTERS)[number] {
  return !!value && (STATUS_FILTERS as readonly string[]).includes(value);
}

export default async function AdminProductCommentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = isValidStatus(searchParams.status) ? searchParams.status : "PENDING";

  const [comments, pendingCount] = await Promise.all([
    prisma.productComment.findMany({
      where: { deletedAt: null, ...(status === "ALL" ? {} : { status }) },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
        images: true,
      },
      take: 200,
    }),
    prisma.productComment.count({ where: { status: "PENDING", deletedAt: null } }),
  ]);

  return (
    <div>
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
        <MessageSquare className="size-5 text-accent-400" />
        دیدگاه‌های محصولات
      </h2>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter}
            href={`/account/admin/product-comments?status=${filter}`}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors",
              status === filter
                ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                : "border-foreground/10 text-foreground/60 hover:border-foreground/30",
            )}
          >
            {filter === "ALL" ? "همه" : APPROVAL_STATUS[filter]?.label ?? filter}
            {filter === "PENDING" && pendingCount > 0 && (
              <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {comments.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="دیدگاهی با این وضعیت یافت نشد." />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const authorLabel = comment.user.name || comment.user.email;
            const statusInfo = APPROVAL_STATUS[comment.status];
            return (
              <div
                key={comment.id}
                className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{authorLabel}</span>
                      <span className="text-foreground/30">·</span>
                      <Link
                        href={`/products/all/${comment.product.slug}`}
                        target="_blank"
                        className="text-sm text-accent-400 hover:underline"
                      >
                        {comment.product.name}
                      </Link>
                      {statusInfo && (
                        <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", statusInfo.className)}>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>
                    {comment.rating != null && (
                      <p className="mt-1 text-xs text-foreground/50">امتیاز: {comment.rating} از ۵</p>
                    )}
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-foreground/75">{comment.text}</p>
                    {comment.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comment.images.map((img) => (
                          <a
                            key={img.id}
                            href={getMediaUrl(img.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-foreground/10"
                          >
                            <Image src={getMediaUrl(img.url)} alt={img.filename} fill sizes="64px" className="object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-xs text-foreground/40">{formatJalali(comment.createdAt)}</p>
                  </div>
                  <ProductCommentActions commentId={comment.id} commentLabel={authorLabel} status={comment.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
