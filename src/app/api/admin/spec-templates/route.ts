import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, SPEC_TEMPLATES_KEY, cleanSpecTemplates } from "@/lib/site-content";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.templates !== "object" || body.templates === null) {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  // Same plain-text sanitising parseProductSpecs applies to a spec's own
  // label, so a default row can't carry markup the product form wouldn't.
  const sanitized = Object.fromEntries(
    Object.entries(body.templates as Record<string, unknown>).map(([key, labels]) => [
      key,
      Array.isArray(labels) ? labels.map((l) => (typeof l === "string" ? sanitizePlainText(l) : "")) : labels,
    ]),
  );
  const templates = cleanSpecTemplates(sanitized);
  const value = JSON.stringify(templates);

  await prisma.siteContent.upsert({
    where: { key: SPEC_TEMPLATES_KEY },
    update: { value },
    create: { key: SPEC_TEMPLATES_KEY, value },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/account/admin/products", "layout");
  return NextResponse.json({ ok: true, templates });
}
