import Image from "next/image";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { Image as ImageIcon } from "@phosphor-icons/react/ssr";
import { getMediaUrl } from "@/lib/media";
import type { Prisma } from "@/generated/prisma/client";

export type BlogPost = Prisma.BlogPostGetPayload<object>;

// Used both by page.tsx (real post) and loading.tsx (post=null) so the
// placeholder card is always exactly this card's real shape.
export function BlogPostCard({ post }: { post: BlogPost | null }) {
  const body = (
    <>
      <div className="relative aspect-video w-full overflow-hidden bg-foreground/5">
        {post ? (
          post.coverImage ? (
            <Image
              src={getMediaUrl(post.coverImage)}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground/20">
              <ImageIcon size={32} />
            </div>
          )
        ) : (
          <Skeleton className="absolute inset-0 h-full w-full" borderRadius={0} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p dir="ltr" className="text-right text-xs text-foreground/50">
          {post ? post.publishedAt?.toLocaleDateString("fa-IR") : <Skeleton width={80} />}
        </p>
        <h2 className="mt-2 text-lg font-bold leading-7">{post ? post.title : <Skeleton width="80%" height={20} />}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/70">
          {post ? post.excerpt : <Skeleton count={2} inline={false} />}
        </p>
        {post && <span className="mt-4 text-sm font-semibold text-accent-400">ادامه مطلب ←</span>}
      </div>
    </>
  );

  if (!post) {
    return <div className="flex flex-col overflow-hidden rounded-2xl border border-transparent bg-foreground/[0.03]">{body}</div>;
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-transparent bg-foreground/[0.03] transition-colors hover:border-accent-500/40"
    >
      {body}
    </Link>
  );
}
