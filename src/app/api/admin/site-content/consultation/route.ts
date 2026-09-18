import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, CONSULTATION_KEY, type ConsultationContent } from "@/lib/site-content";

const MAX_TEXT = 300;

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

  const content: ConsultationContent = {
    eyebrow: cleanText(body.eyebrow),
    heading: cleanText(body.heading),
    subheading: cleanText(body.subheading, 500),
  };

  await prisma.siteContent.upsert({
    where: { key: CONSULTATION_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: CONSULTATION_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  return NextResponse.json({ ok: true, content });
}
