import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, HEADER_NAV_LABELS_KEY, type HeaderNavLabelsContent } from "@/lib/site-content";
import { DEFAULT_HEADER_NAV_LABELS } from "@/lib/site-content-defaults";

const MAX_TEXT = 30;

function cleanText(value: unknown, fallback: string): string {
  const cleaned = sanitizePlainText(typeof value === "string" ? value : "").slice(0, MAX_TEXT);
  return cleaned || fallback;
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

  // An empty label would leave a nav item with no visible text — fall back
  // to the default for that key instead, same rule for every one of the 5.
  const content: HeaderNavLabelsContent = {
    home: cleanText(body.home, DEFAULT_HEADER_NAV_LABELS.home),
    about: cleanText(body.about, DEFAULT_HEADER_NAV_LABELS.about),
    clients: cleanText(body.clients, DEFAULT_HEADER_NAV_LABELS.clients),
    blog: cleanText(body.blog, DEFAULT_HEADER_NAV_LABELS.blog),
    faq: cleanText(body.faq, DEFAULT_HEADER_NAV_LABELS.faq),
  };

  await prisma.siteContent.upsert({
    where: { key: HEADER_NAV_LABELS_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: HEADER_NAV_LABELS_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  // Header renders via the root layout on every route.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, content });
}
