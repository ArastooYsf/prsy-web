import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";
import { sanitizeRichText, sanitizePlainText } from "@/lib/sanitize";
import { linkifyKnownPhrases } from "@/lib/site-section-links";
import { SITE_URL, toAbsoluteUrl } from "@/lib/site-url";
import { PencilSimple } from "@phosphor-icons/react/ssr";
import BlogViewTracker from "@/components/BlogViewTracker";
import ThemedProse from "@/components/ui/ThemedProse";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

export const revalidate = 60;

async function getPost(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, published: true },
      include: { author: { select: { name: true } } },
    });
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
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
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

  const safeContent = linkifyKnownPhrases(sanitizeRichText(post.content));

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    ...(post.coverImage ? { image: [toAbsoluteUrl(getMediaUrl(post.coverImage))] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.name || "پویش راه صنعت یاشار" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <article className="relative pb-20 pt-14 sm:pb-28 sm:pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />
      <ThemedGridBackdrop />
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
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 px-4 py-1.5 text-xs font-semibold text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
              >
                <PencilSimple size={14} />
                ویرایش پست
              </Link>
            )}
          </div>

          {post.publishedAt && (
            <p dir="ltr" className="mt-6 text-right text-xs text-foreground/50">
              {post.publishedAt.toLocaleDateString("fa-IR")}
            </p>
          )}
          <h1 className="mt-2 text-balance text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>

          {post.coverImage && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10">
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

          <ThemedProse
            html={safeContent}
            className="prose prose-sm mt-8 max-w-none leading-8 sm:prose-base [&_a]:text-accent-400"
          />
        </div>
      </div>
    </article>
  );
}
