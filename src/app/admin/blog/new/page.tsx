import BlogPostForm from "@/components/admin/BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">پست جدید</h2>
      <BlogPostForm mode="create" />
    </div>
  );
}
