"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { BlogPostCard, type BlogPost } from "./BlogPostCard";

// Split out from page.tsx (a Server Component fetching directly from
// prisma) purely so this grid can use framer-motion — matching the same
// staggered entrance every other public-site card grid already has
// (ProductCategories, Customers, WhyUs, ...). loading.tsx renders
// BlogPostCard's skeleton state directly, without this wrapper, since a
// loading skeleton should appear instantly, not fade in.
export function BlogPostGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer(0.08)}
      className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={fadeInUp}>
          <BlogPostCard post={post} />
        </motion.div>
      ))}
    </motion.div>
  );
}
