import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { SITE_CONTENT_TAG, SOCIALPROOF_KEY, type SocialProofContent } from "@/lib/site-content";
import type { StatContent, TestimonialContent } from "@/lib/site-content-defaults";

const MAX_TEXT = 300;
const MAX_QUOTE = 800;
const MAX_ITEMS = 12;

function cleanText(value: unknown, maxLength = MAX_TEXT): string {
  return sanitizePlainText(typeof value === "string" ? value : "").slice(0, maxLength);
}

function cleanStat(raw: unknown): StatContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const value = typeof r.value === "number" && Number.isFinite(r.value) ? Math.trunc(r.value) : NaN;
  const label = cleanText(r.label, 100);
  if (Number.isNaN(value) || !label) return null;
  return { value, suffix: cleanText(r.suffix, 10), label };
}

function cleanTestimonial(raw: unknown): TestimonialContent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const quote = cleanText(r.quote, MAX_QUOTE);
  const name = cleanText(r.name, 100);
  if (!quote || !name) return null;
  return { quote, name, role: cleanText(r.role, 150) };
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

  const stats = Array.isArray(body.stats)
    ? body.stats
        .slice(0, MAX_ITEMS)
        .map(cleanStat)
        .filter((s: StatContent | null): s is StatContent => s !== null)
    : [];

  const sectors = Array.isArray(body.sectors)
    ? body.sectors
        .slice(0, MAX_ITEMS)
        .map((s: unknown) => cleanText(s, 100))
        .filter((s: string) => s.length > 0)
    : [];

  const testimonials = Array.isArray(body.testimonials)
    ? body.testimonials
        .slice(0, MAX_ITEMS)
        .map(cleanTestimonial)
        .filter((t: TestimonialContent | null): t is TestimonialContent => t !== null)
    : [];

  const content: SocialProofContent = { stats, sectors, testimonials };

  await prisma.siteContent.upsert({
    where: { key: SOCIALPROOF_KEY },
    update: { value: JSON.stringify(content) },
    create: { key: SOCIALPROOF_KEY, value: JSON.stringify(content) },
  });

  revalidateTag(SITE_CONTENT_TAG);
  revalidatePath("/");

  return NextResponse.json({ ok: true, content });
}
