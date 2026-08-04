import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });

  if (!post) notFound();

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">ویرایش پست</h2>
      <BlogPostForm
        mode="edit"
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          published: post.published,
          publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        }}
      />
    </div>
  );
}
