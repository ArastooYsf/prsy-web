import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, LEGAL_PAGE_KEYS, type LegalPageKey } from "@/lib/site-content";

const MAX_HTML_LENGTH = 20000;

// Which public route(s) show each page, so saving one only busts the cache
// pages that actually render it (contact-intro only affects /contact, but
// the reverse isn't true — nothing here reads from more than one page).
const REVALIDATE_PATHS: Record<LegalPageKey, string[]> = {
  terms: ["/terms"],
  privacy: ["/privacy"],
  warranty: ["/warranty"],
  "contact-intro": ["/contact"],
};

function isLegalPageKey(value: unknown): value is LegalPageKey {
  return typeof value === "string" && value in LEGAL_PAGE_KEYS;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const page: unknown = body?.page;
  if (!body || !isLegalPageKey(page)) {
    return NextResponse.json({ error: "صفحه نامعتبر است." }, { status: 400 });
  }

  const html = sanitizeRichText(typeof body.html === "string" ? body.html : "").slice(0, MAX_HTML_LENGTH);
  const key = LEGAL_PAGE_KEYS[page];

  await prisma.siteContent.upsert({
    where: { key },
    update: { value: html },
    create: { key, value: html },
  });

  revalidateTag(SITE_CONTENT_TAG);
  for (const path of REVALIDATE_PATHS[page]) revalidatePath(path);

  return NextResponse.json({ ok: true, html });
}
