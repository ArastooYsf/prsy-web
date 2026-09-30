import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runLighthouseAudit, type LighthouseStrategy } from "@/lib/lighthouse";

function parseStrategies(body: unknown): LighthouseStrategy[] {
  const value = (body as { strategy?: unknown } | null)?.strategy;
  if (value === "both") return ["mobile", "desktop"];
  if (value === "mobile" || value === "desktop") return [value];
  return ["desktop"]; // back-compat default for any caller that omits it
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const strategies = parseStrategies(body);

  const runs = [];
  const errors: { strategy: LighthouseStrategy; error: string }[] = [];
  for (const strategy of strategies) {
    const result = await runLighthouseAudit(strategy);
    if ("error" in result) errors.push({ strategy, error: result.error });
    else runs.push(result.run);
  }

  if (runs.length === 0) {
    return NextResponse.json({ error: errors[0]?.error ?? "اجرای تست سرعت ناموفق بود.", errors }, { status: 502 });
  }

  return NextResponse.json({ runs, errors: errors.length > 0 ? errors : undefined });
}
