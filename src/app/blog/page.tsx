import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BlogPostCard } from "./BlogPostCard";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

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
        <ThemedGridBackdrop />
        <div className="container relative text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/70 backdrop-blur-sm sm:text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            وبلاگ
          </span>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-5xl">
            آخرین <span className="text-accent-soft">مقالات و اخبار</span>
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
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
