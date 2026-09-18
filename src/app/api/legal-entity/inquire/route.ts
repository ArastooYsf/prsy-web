import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { authOptions } from "@/lib/auth";
import { actorFromSession, logEvent } from "@/lib/logger";
import { getCompanyInfo, isValidNationalIdFormat } from "@/lib/integrations/api-ir";
import { interpretCompanyInfo, summarizeOutcome } from "@/lib/national-id-verification";

// This is a real per-call cost against a paid third-party service, and the
// route must stay reachable by an anonymous visitor (step 2 of registration
// happens before any account/session exists) — so it can't just be gated
// behind auth like most other API routes. Per-IP rate limiting is the only
// practical guard available at that point. Generous enough for someone
// genuinely retrying a mistyped ID a few times, tight enough to make
// scripted abuse (running up the site owner's api.ir bill, or scraping
// company records through this as a free proxy) impractical.
const INQUIRY_RATE_LIMIT_MAX = 8;
const INQUIRY_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

const inquiryIpRateLimiter = new RateLimiterMemory({
  points: INQUIRY_RATE_LIMIT_MAX,
  duration: INQUIRY_RATE_LIMIT_WINDOW_SECONDS,
});

const ANONYMOUS_ACTOR = { id: "anonymous", name: null, email: "-", role: "ANONYMOUS" };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    await inquiryIpRateLimiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "تعداد درخواست‌های استعلام بیش از حد مجاز است، کمی بعد دوباره تلاش کنید." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const nationalId = typeof body?.nationalId === "string" ? body.nationalId.trim() : "";

  if (!nationalId) {
    return NextResponse.json({ error: "شناسه ملی را وارد کنید." }, { status: 400 });
  }
  if (!isValidNationalIdFormat(nationalId)) {
    return NextResponse.json({ error: "شناسه ملی باید دقیقاً ۱۱ رقم باشد." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const actor = session?.user ? actorFromSession(session) : ANONYMOUS_ACTOR;

  const response = await getCompanyInfo(nationalId);
  const outcome = interpretCompanyInfo(response);

  await logEvent({
    actor,
    action: outcome.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
    target: { type: "national_id", id: nationalId, label: `استعلام شناسه ملی «${nationalId}»` },
    summary: summarizeOutcome(outcome),
  });

  if (!outcome.verified) {
    return NextResponse.json({ error: outcome.message }, { status: 422 });
  }

  return NextResponse.json({
    company: {
      name: outcome.officialName,
      companyType: outcome.companyType,
      active: outcome.active,
      dissolved: outcome.dissolved,
      warning: outcome.dissolved ? outcome.message : null,
      address: response.data?.address ?? null,
      postalCode: response.data?.postalCode ?? null,
      province: response.data?.province ?? null,
      city: response.data?.city ?? null,
    },
  });
}
