import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { normalizeSocialUrl } from "@/lib/social-platforms";
import { SITE_CONTENT_TAG, FOOTER_CONTACT_KEY, type FooterContactContent } from "@/lib/site-content";

const MAX_TEXT_LENGTH = 300;

function cleanText(value: unknown, maxLength = MAX_TEXT_LENGTH): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
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

  return NextResponse.json({ ok: true, contact });
}
