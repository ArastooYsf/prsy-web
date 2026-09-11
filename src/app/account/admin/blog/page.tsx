import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Newspaper, Plus } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { AdminTableScroll, AdminTh } from "@/components/admin/AdminTable";
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
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent-500 px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
          <Plus className="size-4" />
          پست جدید
        </Link>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper />}
          title="هنوز پستی ثبت نشده است."
          description="اولین پست وبلاگ رو ثبت کنید تا اینجا نمایش داده بشه."
          action={{ label: "پست جدید", href: "/account/admin/blog/new" }}
        />
      ) : (
        <>
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {posts.map((post) => (
              <BlogCardMobile key={post.id} post={post} />
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <AdminTableScroll>
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <AdminTh corner="start">عنوان</AdminTh>
                  <AdminTh>وضعیت</AdminTh>
                  <AdminTh>تاریخ انتشار</AdminTh>
                  <AdminTh>بازدید</AdminTh>
                  <AdminTh corner="end" />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <BlogRowDesktop key={post.id} post={post} />
                ))}
              </tbody>
            </table>
          </AdminTableScroll>
        </>
      )}
    </div>
  );
}
