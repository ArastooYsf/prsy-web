import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, CONTACT_HERO_KEY, type ContactHeroContent } from "@/lib/site-content";

const MAX_TEXT = 200;

function cleanText(value: unknown, maxLength = MAX_TEXT): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const content: ContactHeroContent = {
    badge: cleanText(body.badge, 60),
    heading: cleanText(body.heading, 150),
    mapLabel: cleanText(body.mapLabel, 100),
  };

  await prisma.siteContent.upsert({
    where: { key: CONTACT_HERO_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: CONTACT_HERO_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/contact");

  return NextResponse.json({ ok: true, content });
}
