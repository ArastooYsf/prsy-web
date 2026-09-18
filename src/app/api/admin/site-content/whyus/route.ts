import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, WHYUS_KEY, type WhyUsContent } from "@/lib/site-content";
import { ICON_OPTIONS, type IconCardContent } from "@/lib/site-content-defaults";

const MAX_TEXT = 300;
const MAX_DESCRIPTION = 1000;
const MAX_ITEMS = 12;

const VALID_ICON_KEYS = new Set<string>(ICON_OPTIONS.map((opt) => opt.key));

function cleanText(value: unknown, maxLength = MAX_TEXT): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
}

function cleanIconCard(raw: unknown): IconCardContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = cleanText(r.title, 200);
  const description = cleanText(r.description, MAX_DESCRIPTION);
  if (!title || !description) return null;
  const icon = typeof r.icon === "string" && VALID_ICON_KEYS.has(r.icon) ? r.icon : ICON_OPTIONS[0].key;
  return { title, description, icon: icon as IconCardContent["icon"] };
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

  const advantages = Array.isArray(body.advantages)
    ? body.advantages
        .slice(0, MAX_ITEMS)
        .map(cleanIconCard)
        .filter((item: IconCardContent | null): item is IconCardContent => item !== null)
    : [];

  const partners = Array.isArray(body.partners)
    ? body.partners
        .slice(0, MAX_ITEMS)
        .map((p: unknown) => cleanText(p, 120))
        .filter((p: string) => p.length > 0)
    : [];

  const content: WhyUsContent = {
    eyebrow: cleanText(body.eyebrow),
    heading: cleanText(body.heading),
    subheading: cleanText(body.subheading, MAX_DESCRIPTION),
    advantages,
    partnersLabel: cleanText(body.partnersLabel),
    partnersSubtext: cleanText(body.partnersSubtext, MAX_DESCRIPTION),
    partners,
  };

  await prisma.siteContent.upsert({
    where: { key: WHYUS_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: WHYUS_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  return NextResponse.json({ ok: true, content });
}
