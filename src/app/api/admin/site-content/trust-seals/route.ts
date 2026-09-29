import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { normalizeSocialUrl } from "@/lib/social-platforms";
import { SITE_CONTENT_TAG, TRUST_SEALS_KEY, type TrustSealContent } from "@/lib/site-content";

const MAX_LABEL_LENGTH = 80;
const MAX_IMAGE_LENGTH = 500;

function cleanTrustSeal(raw: unknown): TrustSealContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;

  const label = sanitizePlainText(typeof r.label === "string" ? r.label : "").slice(0, MAX_LABEL_LENGTH);
  // Media path picked from the library, same as SiteLogoContent.logo — not a
  // full external URL, so no scheme validation needed here.
  const image = sanitizePlainText(typeof r.image === "string" ? r.image : "").slice(0, MAX_IMAGE_LENGTH);
  // The issuer's verification link is external and http(s)-only — mirrors
  // socialLinks/footer-contact's mapUrl, closing the same "javascript:" gap.
  const href = normalizeSocialUrl(typeof r.href === "string" ? r.href : "");
  // Both are required: an image with no reference link (or vice versa) isn't
  // a usable seal — silently dropping it here is safer than saving a half item.
  if (!image || !href) return null;

  return { id: r.id, label: label || "نماد اعتماد", image, href };
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

  const items = body.items.map(cleanTrustSeal).filter((item: TrustSealContent | null): item is TrustSealContent => item !== null);

  await prisma.siteContent.upsert({
    where: { key: TRUST_SEALS_KEY },
    update: { value: JSON.stringify(items) },
    create: { key: TRUST_SEALS_KEY, value: JSON.stringify(items) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  // Footer renders via the root layout on every route, not just "/".
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, items });
}
