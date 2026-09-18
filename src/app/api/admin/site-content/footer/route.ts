import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, FOOTER_CONTENT_KEY, type FooterEditableContent } from "@/lib/site-content";
import { DEFAULT_FOOTER_CONTENT, type FooterLinkContent } from "@/lib/site-content-defaults";

const MAX_TEXT = 300;

function cleanText(value: unknown, maxLength = MAX_TEXT): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
}

// The set of valid ids is fixed in code (DEFAULT_FOOTER_CONTENT) — only the
// label for each known id is accepted, so a client-side bug or tampered
// request can never inject a link with an arbitrary/unknown id (which
// Footer.tsx wouldn't know how to resolve an href for anyway).
function cleanLinks(raw: unknown, defaults: FooterLinkContent[]): FooterLinkContent[] {
  const incoming = Array.isArray(raw) ? (raw as unknown[]) : [];
  const byId = new Map<string, string>();
  for (const item of incoming) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id === "string") byId.set(r.id, cleanText(r.label, 60));
  }
  return defaults.map((d) => ({ id: d.id, label: byId.get(d.id) || d.label }));
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

  const content: FooterEditableContent = {
    tagline: cleanText(body.tagline, 400),
    copyrightSuffix: cleanText(body.copyrightSuffix, 150),
    quickLinks: cleanLinks(body.quickLinks, DEFAULT_FOOTER_CONTENT.quickLinks),
    services: cleanLinks(body.services, DEFAULT_FOOTER_CONTENT.services),
  };

  await prisma.siteContent.upsert({
    where: { key: FOOTER_CONTENT_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: FOOTER_CONTENT_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  // Footer renders via the root layout on every route.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, content });
}
