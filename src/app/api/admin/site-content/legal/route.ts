import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, LEGAL_PAGE_KEYS, type LegalPageKey, type LegalPageWithHeading } from "@/lib/site-content";
import { DEFAULT_LEGAL_HEADINGS, type LegalPageHeadingContent } from "@/lib/site-content-defaults";

const MAX_HTML_LENGTH = 20000;

// Only terms/privacy/warranty have their own hero heading (contact-intro's
// "hero" belongs to the /contact page itself, edited separately there).
const HEADING_KEYS: Record<LegalPageWithHeading, string> = {
  terms: "page.terms.heading",
  privacy: "page.privacy.heading",
  warranty: "page.warranty.heading",
};

function hasHeading(page: LegalPageKey): page is LegalPageWithHeading {
  return page !== "contact-intro";
}

function cleanHeading(raw: unknown, page: LegalPageWithHeading): LegalPageHeadingContent {
  const fallback = DEFAULT_LEGAL_HEADINGS[page];
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const eyebrow = sanitizePlainText(typeof r.eyebrow === "string" ? r.eyebrow : "").slice(0, 60);
  const heading = sanitizePlainText(typeof r.heading === "string" ? r.heading : "").slice(0, 150);
  return { eyebrow: eyebrow || fallback.eyebrow, heading: heading || fallback.heading };
}

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

  const writes = [
    prisma.siteContent.upsert({
      where: { key },
      update: { value: html },
      create: { key, value: html },
    }),
  ];

  let heading: LegalPageHeadingContent | undefined;
  if (hasHeading(page)) {
    heading = cleanHeading(body.heading, page);
    const headingKey = HEADING_KEYS[page];
    const headingValue = JSON.stringify(heading);
    writes.push(
      prisma.siteContent.upsert({
        where: { key: headingKey },
        update: { value: headingValue },
        create: { key: headingKey, value: headingValue },
      }),
    );
  }

  await Promise.all(writes);

  revalidateTag(SITE_CONTENT_TAG);
  for (const path of REVALIDATE_PATHS[page]) revalidatePath(path);

  return NextResponse.json({ ok: true, html, heading });
}
