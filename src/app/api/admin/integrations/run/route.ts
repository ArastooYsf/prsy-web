import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { authOptions } from "@/lib/auth";
import { actorFromSession, logEvent } from "@/lib/logger";
import { getService } from "@/lib/integrations/registry";

// Executes exactly one registered IntegrationService. The registry (not this
// route) owns what each service does and which api.ir/Kavenegar/Resend
// function it calls — this route only: checks ADMIN, looks the service up by
// id, validates the client's *input* against its field schema, and reports
// what the service itself returned. It never trusts client-supplied output,
// only client-supplied input.
//
// Same reasoning as src/app/api/legal-entity/inquire/route.ts's rate limiter:
// several of these services (api.ir lookups, Kavenegar SMS) are billable
// per-call. This route is ADMIN-only (unlike that anonymous one), so the
// limit is generous — it's just a guard against a runaway UI/double-click,
// not an abuse defense.
const RUN_RATE_LIMIT_MAX = 20;
const RUN_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const runRateLimiter = new RateLimiterMemory({ points: RUN_RATE_LIMIT_MAX, duration: RUN_RATE_LIMIT_WINDOW_SECONDS });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  try {
    await runRateLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json({ error: "تعداد اجراهای شما بیش از حد مجاز است، کمی بعد دوباره تلاش کنید." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  const rawInput = body?.input && typeof body.input === "object" ? body.input : {};

  const service = getService(providerId, serviceId);
  if (!service) {
    return NextResponse.json({ error: "سرویس مورد نظر یافت نشد." }, { status: 404 });
  }

  const input: Record<string, string> = {};
  for (const field of service.fields) {
    const value = typeof rawInput[field.name] === "string" ? rawInput[field.name].trim() : "";
    if (field.required && !value) {
      return NextResponse.json({ error: `فیلد «${field.label}» الزامی است.` }, { status: 400 });
    }
    input[field.name] = value;
  }

  const result = await service.run(input);

  // These calls are often billable (api.ir's per-inquiry wallet model,
  // Kavenegar's per-SMS cost) — logging exactly what was queried, by whom,
  // and whether it succeeded is what makes cost tracking possible later, not
  // just "someone ran something."
  const inputSummary = service.fields
    .filter((field) => input[field.name])
    .map((field) => `${field.label}: ${input[field.name]}`)
    .join("، ");
  const outcomeSummary = result.ok ? result.message : result.error;
  const summary = [inputSummary, outcomeSummary].filter(Boolean).join(" — ") || undefined;

  await logEvent({
    actor: actorFromSession(session),
    action: result.ok ? "integration_run_success" : "integration_run_failed",
    target: { type: "integration_service", id: `${providerId}/${serviceId}`, label: `${providerId} — ${service.displayName}` },
    summary,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ data: result.data, message: result.message ?? null });
}
