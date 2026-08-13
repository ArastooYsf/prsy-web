import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default async function NewBlogPostPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  return (
    <div>
      <h2 className="mb-6 text-lg font-bold">پست جدید</h2>
      <BlogPostForm mode="create" />
    </div>
  );
}
