import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "وبلاگ",
  description: "آخرین مقالات و اخبار پویش راه صنعت یاشار درباره دیزل ژنراتور و موتور برق.",
};

export const revalidate = 60;

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <section className="relative overflow-hidden pb-8 pt-14 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_40%,transparent_100%)]" />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            وبلاگ
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-black leading-tight sm:text-5xl">
            آخرین <span className="text-gradient">مقالات و اخبار</span>
          </h1>
        </div>
      </section>

      <section className="relative pb-20 pt-4 sm:pb-28">
        <div className="container">
          {posts.length === 0 ? (
            <p className="mx-auto max-w-md text-center text-sm leading-7 text-foreground/60">
              هنوز مقاله‌ای منتشر نشده است. به‌زودی مطالب جدید اضافه خواهد شد.
            </p>
          ) : (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white/[0.03] transition-colors hover:border-accent-500/40"
                >
                  <div className="aspect-video w-full overflow-hidden bg-white/5">
                    {post.coverImage ? (
                      <img
                        src={getMediaUrl(post.coverImage)}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-foreground/20">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M3 16l5-5 4 4 4-4 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {post.publishedAt && (
                      <p dir="ltr" className="text-right text-xs text-foreground/50">
                        {post.publishedAt.toLocaleDateString("fa-IR")}
                      </p>
                    )}
                    <h2 className="mt-2 text-lg font-bold leading-7">{post.title}</h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground/70">{post.excerpt}</p>
                    )}
                    <span className="mt-4 text-sm font-semibold text-accent-400">ادامه مطلب ←</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
