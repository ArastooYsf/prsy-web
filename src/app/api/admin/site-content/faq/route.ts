import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, FAQ_ITEMS_KEY, type FaqItemContent } from "@/lib/site-content";

const MAX_QUESTION_LENGTH = 300;
const MAX_ANSWER_LENGTH = 2000;

function cleanFaqItem(raw: unknown): FaqItemContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;

  const question = sanitizePlainText(typeof r.question === "string" ? r.question : "").slice(0, MAX_QUESTION_LENGTH);
  const answer = sanitizePlainText(typeof r.answer === "string" ? r.answer : "").slice(0, MAX_ANSWER_LENGTH);
  if (!question || !answer) return null;

  return { id: r.id, question, answer };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const items = body.items.map(cleanFaqItem).filter((item: FaqItemContent | null): item is FaqItemContent => item !== null);

  await prisma.siteContent.upsert({
    where: { key: FAQ_ITEMS_KEY },
    update: { value: JSON.stringify(items) },
    create: { key: FAQ_ITEMS_KEY, value: JSON.stringify(items) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");
  revalidatePath("/faq");

  return NextResponse.json({ ok: true, items });
}
