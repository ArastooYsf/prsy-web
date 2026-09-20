import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Persists a logged-in user's manual light/dark choice to their account
// (User.themeLight, see prisma/schema.prisma) so it follows them to any
// device — the cookie in RouteThemeScope.tsx is the equivalent for a
// signed-out visitor, scoped to that one browser instead.
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (body?.theme !== "light" && body?.theme !== "dark") {
    return NextResponse.json({ error: "مقدار تم نامعتبر است." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { themeLight: body.theme === "light" },
  });

  return NextResponse.json({ ok: true });
}
