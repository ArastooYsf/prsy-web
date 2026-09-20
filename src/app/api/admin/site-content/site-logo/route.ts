import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, SITE_LOGO_KEY, type SiteLogoContent } from "@/lib/site-content";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  // An image path picked from the media library; empty restores the default monogram.
  const content: SiteLogoContent = { logo: sanitizePlainText(typeof body.logo === "string" ? body.logo : "").slice(0, 500) };

  await prisma.siteContent.upsert({
    where: { key: SITE_LOGO_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: SITE_LOGO_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, content });
}
