import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 255) : null;
  if (!path) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;
  await prisma.pageView.create({ data: { path, userAgent } });

  return NextResponse.json({ ok: true });
}
