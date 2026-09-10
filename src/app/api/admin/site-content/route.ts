import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, type HeroSlideContent } from "@/lib/site-content";

const MAX_TEXT_LENGTH = 300;
const MAX_HTML_LENGTH = 5000;

function cleanHeroSlide(raw: unknown): HeroSlideContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;

  return {
    id: r.id,
    title: sanitizePlainText(typeof r.title === "string" ? r.title : "").slice(0, MAX_TEXT_LENGTH),
    description: typeof r.description === "string" ? r.description.slice(0, MAX_HTML_LENGTH) : "",
    ctaLabel: sanitizePlainText(typeof r.ctaLabel === "string" ? r.ctaLabel : "").slice(0, MAX_TEXT_LENGTH),
    ctaHref: sanitizePlainText(typeof r.ctaHref === "string" ? r.ctaHref : "").slice(0, MAX_TEXT_LENGTH),
    image: typeof r.image === "string" ? r.image : "",
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.heroSlides)) {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  const heroSlides = body.heroSlides.map(cleanHeroSlide).filter((s: HeroSlideContent | null): s is HeroSlideContent => s !== null);

  await prisma.siteContent.upsert({
    where: { key: "hero.slides" },
    update: { value: JSON.stringify(heroSlides) },
    create: { key: "hero.slides", value: JSON.stringify(heroSlides) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
