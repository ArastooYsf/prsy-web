import { BlogPostCard } from "./BlogPostCard";
import ThemedGridBackdrop from "@/components/ui/ThemedGridBackdrop";

const PLACEHOLDER_CARDS = Array.from({ length: 6 });

export default function Loading() {
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
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_CARDS.map((_, i) => (
              <BlogPostCard key={i} post={null} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
