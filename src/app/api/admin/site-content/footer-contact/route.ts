import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { normalizeSocialUrl } from "@/lib/social-platforms";
import { SITE_CONTENT_TAG, FOOTER_CONTACT_KEY, type FooterContactContent } from "@/lib/site-content";
import { actorFromSession, logEvent } from "@/lib/logger";

const MAX_TEXT_LENGTH = 300;

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
}

// sanitizePlainText HTML-entity-encodes "&" (safe for text later dropped
// into HTML, wrong for a value used as a URL attribute) — a real map link
// with more than one query param (e.g. "...q=...&output=embed") would come
// back corrupted. Just trim/cap; React escapes attribute output itself.
//
// Mirrors ContactMapCard's own coordinate check: "lat,lng" is stored as-is
// (never used as a URL), anything else must normalize to a real http(s)
// link — this field renders as both an <a href> and an <iframe src> on the
// public /contact page, so a scheme like "javascript:" can't be allowed
// through the way it would be for e.g. socialLinks' known-safe icon-only use.
const COORDINATES_RE = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/;

function cleanMapUrl(value: unknown, maxLength = 500): string {
  const text = typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  if (!text || COORDINATES_RE.test(text)) return text;
  return normalizeSocialUrl(text);
}

const MAX_SOCIAL_LINKS = 12;

// Each entry must normalise to a real http(s) URL (a missing scheme is added
// for the admin); anything else is dropped so a typo can't become a live
// footer link. Duplicates collapse.
function cleanSocialLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const raw of value) {
    const url = normalizeSocialUrl(cleanText(raw, 500));
    if (url && !out.includes(url)) out.push(url);
    if (out.length >= MAX_SOCIAL_LINKS) break;
  }
  return out;
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

  const contact: FooterContactContent = {
    address: cleanText(body.address),
    phone: cleanText(body.phone, 40),
    phoneHref: cleanText(body.phoneHref, 40),
    email: cleanText(body.email, 120),
    socialLinks: cleanSocialLinks(body.socialLinks),
    mapUrl: cleanMapUrl(body.mapUrl),
  };

  await prisma.siteContent.upsert({
    where: { key: FOOTER_CONTACT_KEY },
    update: { value: JSON.stringify(contact) },
    create: { key: FOOTER_CONTACT_KEY, value: JSON.stringify(contact) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  // Footer renders via the root layout on every route, not just "/" — the
  // "layout" type revalidates every page nested under it in one call.
  revalidatePath("/", "layout");

  await logEvent({
    actor: actorFromSession(session),
    action: "update",
    target: { type: "site_content", id: FOOTER_CONTACT_KEY, label: "اطلاعات تماس فوتر" },
  });

  return NextResponse.json({ ok: true, contact });
}
