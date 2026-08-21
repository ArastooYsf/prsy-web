import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { sanitizeRichText } from "@/lib/sanitize";
import BlogViewTracker from "@/components/BlogViewTracker";

export const revalidate = 60;

async function getPost(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  try {
    return await prisma.blogPost.findFirst({ where: { slug, published: true } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [getMediaUrl(post.coverImage)] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) notFound();

  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "ADMIN";

  const safeContent = sanitizeRichText(post.content);

  return (
    <article className="relative pb-20 pt-14 sm:pb-28 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
      <BlogViewTracker postId={post.id} />
      <div className="container relative">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/blog" className="text-sm font-semibold text-accent-400">
              → بازگشت به وبلاگ
            </Link>
            {canEdit && (
              <Link
                href={`/account/admin/blog/${post.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20h4l10.5-10.5a2 2 0 000-2.8l-1.2-1.2a2 2 0 00-2.8 0L4 16v4z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                ویرایش پست
              </Link>
            )}
          </div>

          {post.publishedAt && (
            <p dir="ltr" className="mt-6 text-right text-xs text-foreground/50">
              {post.publishedAt.toLocaleDateString("fa-IR")}
            </p>
          )}
          <h1 className="mt-2 text-balance text-3xl font-black leading-tight sm:text-4xl">{post.title}</h1>

          {post.coverImage && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={getMediaUrl(post.coverImage)}
                alt={post.title}
                fill
                priority
                sizes="(min-width: 1024px) 42rem, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-invert prose-sm mt-8 max-w-none leading-8 sm:prose-base [&_a]:text-accent-400"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </div>
      </div>
    </article>
  );
}
