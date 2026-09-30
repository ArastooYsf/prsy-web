import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, DEFAULT_HERO_SETTINGS, type HeroSlideContent, type HeroSettingsContent } from "@/lib/site-content";
import { actorFromSession, logEvent } from "@/lib/logger";

const MAX_TEXT_LENGTH = 300;
const MAX_HTML_LENGTH = 5000;
// Below MIN it flicks past before anyone can read it; above MAX the slider
// reads as stuck/broken rather than intentionally slow.
const MIN_AUTOPLAY_SECONDS = 2;
const MAX_AUTOPLAY_SECONDS = 30;

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

function cleanHeroSettings(raw: unknown): HeroSettingsContent {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const parsed = typeof r.autoplaySeconds === "number" ? r.autoplaySeconds : Number(r.autoplaySeconds);
  const autoplaySeconds = Number.isFinite(parsed)
    ? Math.min(Math.max(Math.round(parsed), MIN_AUTOPLAY_SECONDS), MAX_AUTOPLAY_SECONDS)
    : DEFAULT_HERO_SETTINGS.autoplaySeconds;
  return { autoplaySeconds };
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
  const heroSettings = cleanHeroSettings(body.heroSettings);

  await Promise.all([
    prisma.siteContent.upsert({
      where: { key: "hero.slides" },
      update: { value: JSON.stringify(heroSlides) },
      create: { key: "hero.slides", value: JSON.stringify(heroSlides) },
    }),
    prisma.siteContent.upsert({
      where: { key: "hero.settings" },
      update: { value: JSON.stringify(heroSettings) },
      create: { key: "hero.settings", value: JSON.stringify(heroSettings) },
    }),
  ]);

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  await logEvent({
    actor: actorFromSession(session),
    action: "update",
    target: { type: "site_content", id: "hero.slides", label: "اسلایدهای هیرو" },
  });

  return NextResponse.json({ ok: true });
}
