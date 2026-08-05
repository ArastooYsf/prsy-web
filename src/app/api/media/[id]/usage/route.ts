import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const asset = await prisma.mediaAsset.findUnique({ where: { id: params.id } });

  if (!asset) {
    return NextResponse.json({ error: "فایل یافت نشد." }, { status: 404 });
  }

  const isStaff = session.user.role === "ADMIN" || session.user.role === "SUPPORT";
  if (!isStaff && asset.uploadedById !== session.user.id) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 403 });
  }

  const [coverOf, contentOf, siteContentOf, contractsOf, repliesOf] = await Promise.all([
    prisma.blogPost.findMany({ where: { coverImage: asset.url }, select: { id: true, title: true } }),
    prisma.blogPost.findMany({ where: { content: { contains: asset.url } }, select: { id: true, title: true } }),
    prisma.siteContent.findMany({ where: { value: { contains: asset.url } }, select: { id: true, key: true } }),
    prisma.contract.findMany({ where: { fileUrl: asset.url }, select: { id: true, title: true } }),
    prisma.ticketReply.findMany({
      where: { attachmentUrl: asset.url },
      select: { id: true, ticket: { select: { subject: true } } },
    }),
  ]);

  const blogPostIds = new Set<string>();
  const usage: { type: string; label: string }[] = [];

  for (const post of [...coverOf, ...contentOf]) {
    if (blogPostIds.has(post.id)) continue;
    blogPostIds.add(post.id);
    usage.push({ type: "blog", label: `پست وبلاگ: ${post.title}` });
  }
  for (const sc of siteContentOf) {
    usage.push({ type: "site-content", label: `محتوای سایت: ${sc.key}` });
  }
  for (const c of contractsOf) {
    usage.push({ type: "contract", label: `قرارداد: ${c.title}` });
  }
  for (const r of repliesOf) {
    usage.push({ type: "ticket", label: `تیکت: ${r.ticket.subject}` });
  }

  return NextResponse.json({ count: usage.length, usage });
}
