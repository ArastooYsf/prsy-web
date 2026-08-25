import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { formatNumber } from "@/lib/format-number";
import DeletePostButton from "@/components/admin/DeletePostButton";
import type { Prisma } from "@/generated/prisma/client";

export type BlogPost = Prisma.BlogPostGetPayload<object>;

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        published ? "border-accent-500/30 bg-accent-500/10 text-accent-400" : "border-foreground/10 bg-foreground/5 text-foreground/60"
      }`}
    >
      {published ? "منتشرشده" : "پیش‌نویس"}
    </span>
  );
}

export function BlogCardMobile({ post }: { post: BlogPost | null }) {
  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        {post ? <p className="font-medium">{post.title}</p> : <Skeleton width="60%" height={15} />}
        {post ? <StatusPill published={post.published} /> : <Skeleton width={70} height={23} borderRadius={9999} containerClassName="shrink-0" />}
      </div>
      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">تاریخ انتشار</dt>
          <dd dir="ltr" className="text-foreground/70">
            {post ? post.publishedAt?.toLocaleDateString("fa-IR") || "—" : <Skeleton width={70} height={11} />}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-foreground/40">بازدید</dt>
          <dd className="flex items-center gap-1 text-foreground/70">
            {post ? (
              <>
                <Eye className="size-3.5" />
                {formatNumber(post.viewCount)}
              </>
            ) : (
              <Skeleton width={30} height={11} />
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-foreground/5 pt-3">
        {post ? (
          <>
            <Link
              href={`/account/admin/blog/${post.id}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
            >
              <Pencil className="size-3.5" />
              ویرایش
            </Link>
            <DeletePostButton id={post.id} title={post.title} />
          </>
        ) : (
          <>
            <Skeleton width={78} height={40} borderRadius={9999} />
            <Skeleton width={40} height={40} borderRadius={9999} />
          </>
        )}
      </div>
    </div>
  );
}

export function BlogRowDesktop({ post }: { post: BlogPost | null }) {
  return (
    <tr className="border-t border-foreground/10">
      <td className="px-4 py-3 font-medium">{post ? post.title : <Skeleton width="70%" height={13} />}</td>
      <td className="px-4 py-3">{post ? <StatusPill published={post.published} /> : <Skeleton width={70} height={22} borderRadius={9999} />}</td>
      <td dir="ltr" className="px-4 py-3 text-right text-foreground/60">
        {post ? post.publishedAt?.toLocaleDateString("fa-IR") || "—" : <Skeleton width={78} height={13} />}
      </td>
      <td className="px-4 py-3 text-foreground/70">
        {post ? (
          <div className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {formatNumber(post.viewCount)}
          </div>
        ) : (
          <Skeleton width={30} height={13} />
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {post ? (
            <>
              <Link
                href={`/account/admin/blog/${post.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                <Pencil className="size-3.5" />
                ویرایش
              </Link>
              <DeletePostButton id={post.id} title={post.title} />
            </>
          ) : (
            <>
              <Skeleton width={78} height={32} borderRadius={9999} />
              <Skeleton width={32} height={32} borderRadius={9999} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
