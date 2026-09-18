import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { authOptions } from "@/lib/auth";
import { actorFromSession, logEvent } from "@/lib/logger";
import { getProvider } from "@/lib/integrations/registry";

// Free/no-real-cost connectivity check for a provider (e.g. api.ir's
// Sandbox/Echo) — deliberately separate from src/app/api/admin/integrations/run,
// which executes a real, possibly billable service. Still rate-limited (more
// generously — this one is never billable) purely as a guard against a
// runaway UI/double-click, not an abuse defense against an already-ADMIN caller.
const TEST_CONNECTION_RATE_LIMIT_MAX = 30;
const TEST_CONNECTION_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const testConnectionRateLimiter = new RateLimiterMemory({
  points: TEST_CONNECTION_RATE_LIMIT_MAX,
  duration: TEST_CONNECTION_RATE_LIMIT_WINDOW_SECONDS,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  try {
    await testConnectionRateLimiter.consume(session.user.id);
  } catch {
    return NextResponse.json({ error: "تعداد درخواست‌های شما بیش از حد مجاز است، کمی بعد دوباره تلاش کنید." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";

  const provider = getProvider(providerId);
  if (!provider || !provider.testConnection) {
    return NextResponse.json({ error: "این سرویس تست اتصال ندارد." }, { status: 404 });
  }

  const result = await provider.testConnection();

  await logEvent({
    actor: actorFromSession(session),
    action: "integration_test_connection",
    target: { type: "integration_provider", id: providerId, label: `تست اتصال ${provider.displayName}` },
    summary: result.ok ? result.message ?? "موفق" : result.error,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json({ data: result.data, message: result.message ?? null });
}
