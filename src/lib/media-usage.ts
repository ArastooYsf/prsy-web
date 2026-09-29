import { prisma } from "@/lib/prisma";

export type MediaUsage = { type: string; label: string };

/**
 * Finds every place a stored file's URL is referenced, so a delete flow can
 * warn before removing something that's still live. Shared by the media
 * gallery's own delete-confirm (src/app/api/media/[id]/usage/route.ts) and
 * the admin "uploaded files" browser.
 *
 * Covers every place a MediaAsset URL can end up: two dedicated columns
 * (Product.images is a JSON array, Brand.logo a plain string) plus anywhere
 * embedded as text (BlogPost cover/content, SiteContent's JSON blobs — which
 * is how the site logo, trust seals, and hero slides are actually stored)
 * and the two tables that keep their own denormalized COPY of a picked
 * asset's fields (TicketAttachment, ProductCommentImage) rather than a live
 * reference — those still count as "in use" since the same physical file is
 * what's being served.
 */
export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  const [coverOf, contentOf, siteContentOf, contractsOf, repliesOf, productsOf, brandsOf, commentImagesOf] =
    await Promise.all([
      prisma.blogPost.findMany({ where: { coverImage: url }, select: { id: true, title: true } }),
      prisma.blogPost.findMany({ where: { content: { contains: url } }, select: { id: true, title: true } }),
      prisma.siteContent.findMany({ where: { value: { contains: url } }, select: { id: true, key: true } }),
      prisma.contract.findMany({ where: { fileUrl: url }, select: { id: true, title: true } }),
      prisma.ticketAttachment.findMany({
        where: { url },
        select: { id: true, reply: { select: { ticket: { select: { subject: true } } } } },
      }),
      prisma.product.findMany({ where: { images: { array_contains: url } }, select: { id: true, name: true } }),
      prisma.brand.findMany({ where: { logo: url }, select: { id: true, name: true } }),
      prisma.productCommentImage.findMany({
        where: { url },
        select: { id: true, comment: { select: { product: { select: { name: true } } } } },
      }),
    ]);

  const blogPostIds = new Set<string>();
  const usage: MediaUsage[] = [];

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
    usage.push({ type: "ticket", label: `تیکت: ${r.reply.ticket.subject}` });
  }
  for (const p of productsOf) {
    usage.push({ type: "product", label: `محصول: ${p.name}` });
  }
  for (const b of brandsOf) {
    usage.push({ type: "brand", label: `لوگوی برند: ${b.name}` });
  }
  for (const ci of commentImagesOf) {
    usage.push({ type: "product-comment", label: `دیدگاه محصول: ${ci.comment.product.name}` });
  }

  return usage;
}
