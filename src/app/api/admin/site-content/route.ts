import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG } from "@/lib/site-content";

const MAX_VALUE_LENGTH = 5000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries = body?.entries;

  if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const pairs = Object.entries(entries).filter(
    (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string",
  );

  if (pairs.length === 0) {
    return NextResponse.json({ error: "هیچ مقداری برای ذخیره ارسال نشده است." }, { status: 400 });
  }

  await prisma.$transaction(
    pairs.map(([key, value]) => {
      const cleanValue = sanitizePlainText(value).slice(0, MAX_VALUE_LENGTH);
      return prisma.siteContent.upsert({
        where: { key },
        update: { value: cleanValue },
        create: { key, value: cleanValue },
      });
    }),
  );

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");

  return NextResponse.json({ ok: true });
}
