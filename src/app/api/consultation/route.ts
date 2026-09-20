import { NextResponse } from "next/server";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { logEvent } from "@/lib/logger";
import { notifyStaffConsultationRequest } from "@/lib/notifications/events";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidEmail, isValidIranPhone, normalizeDigits } from "@/lib/validation";

// Public endpoint (a visitor has no account), so per-IP limiting is the guard
// against someone flooding every admin's inbox.
const limiter = new RateLimiterMemory({ points: 5, duration: 10 * 60 });

const TOPICS = ["مشاوره اولیه", "طراحی و مهندسی", "اجرای پروژه (EPC)", "خرید محصول", "سایر"];
const ANONYMOUS_ACTOR = { id: "anonymous", name: null, email: "-", role: "ANONYMOUS" };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? sanitizePlainText(value).trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "درخواست‌های زیادی ثبت شده است، کمی بعد دوباره تلاش کنید." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "داده ارسالی نامعتبر است." }, { status: 400 });
  }

  // Honeypot: real users never see or fill this field; bots do. Answer as if
  // it succeeded so the bot gets no signal to adapt to.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = text(body.name, 100);
  const phone = normalizeDigits(text(body.phone, 20));
  const email = text(body.email, 200);
  const topic = TOPICS.includes(body.topic) ? body.topic : TOPICS[0];
  const message = text(body.message, 2000);

  if (!name || !phone) {
    return NextResponse.json({ error: "نام و شماره تماس را وارد کنید." }, { status: 400 });
  }
  if (!isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تماس معتبر نیست." }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  }

  const delivered = await notifyStaffConsultationRequest({ name, phone, email, topic, message });
  if (delivered === 0) {
    return NextResponse.json({ error: "ثبت درخواست ممکن نشد، لطفاً با شماره تماس سایت تماس بگیرید." }, { status: 503 });
  }

  await logEvent({
    actor: ANONYMOUS_ACTOR,
    action: "consultation_request",
    target: { type: "consultation", id: "public-form", label: `درخواست مشاوره «${name}»` },
  });

  return NextResponse.json({ ok: true });
}
