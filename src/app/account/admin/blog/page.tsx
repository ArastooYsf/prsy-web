import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeletePostButton from "@/components/admin/DeletePostButton";

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
        <h2 className="text-lg font-bold">پست‌های وبلاگ</h2>
        <Link
          href="/account/admin/blog/new"
          className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/25 transition-colors hover:bg-accent-600"
        >
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
              <div key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{post.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      post.published
                        ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                        : "border-white/10 bg-white/5 text-foreground/60"
                    }`}
                  >
                    {post.published ? "منتشرشده" : "پیش‌نویس"}
                  </span>
                </div>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-foreground/40">تاریخ انتشار</dt>
                    <dd dir="ltr" className="text-foreground/70">
                      {post.publishedAt ? post.publishedAt.toLocaleDateString("fa-IR") : "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  <Link
                    href={`/account/admin/blog/${post.id}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-3.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                  >
                    ویرایش
                  </Link>
                  <DeletePostButton id={post.id} title={post.title} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead className="text-foreground/60">
                <tr>
                  <th className="sticky top-14 z-10 rounded-tr-2xl bg-background px-4 py-3 text-right font-medium lg:top-12">عنوان</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">وضعیت</th>
                  <th className="sticky top-14 z-10 bg-background px-4 py-3 text-right font-medium lg:top-12">تاریخ انتشار</th>
                  <th className="sticky top-14 z-10 rounded-tl-2xl bg-background px-4 py-3 text-right font-medium lg:top-12"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-white/10">
                    <td className="px-4 py-3 font-medium">{post.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                          post.published
                            ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
                            : "border-white/10 bg-white/5 text-foreground/60"
                        }`}
                      >
                        {post.published ? "منتشرشده" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td dir="ltr" className="px-4 py-3 text-right text-foreground/60">
                      {post.publishedAt ? post.publishedAt.toLocaleDateString("fa-IR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/account/admin/blog/${post.id}`}
                          className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent-500/40 hover:text-accent-400"
                        >
                          ویرایش
                        </Link>
                        <DeletePostButton id={post.id} title={post.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
