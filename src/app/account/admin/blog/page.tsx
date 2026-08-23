import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Newspaper, Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BlogCardMobile, BlogRowDesktop } from "./BlogRow";

export const dynamic = "force-dynamic";

export default async function AdminBlogListPage() {
  const session = await getServerSession(authOptions);
  if (session!.user.role !== "ADMIN") {
    redirect("/account/admin");
  }

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Newspaper className="size-5 text-accent-400" />
          پست‌های وبلاگ
        </h2>
        <Link
          href="/account/admin/blog/new"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          پست جدید
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-foreground/60">
          هنوز پستی ثبت نشده است.
        </p>
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {posts.map((post) => (
              <BlogCardMobile key={post.id} post={post} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">عنوان</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">تاریخ انتشار</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">بازدید</th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <BlogRowDesktop key={post.id} post={post} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
