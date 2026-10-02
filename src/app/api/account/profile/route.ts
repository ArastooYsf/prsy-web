import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { verifyNationalId, summarizeOutcome } from "@/lib/national-id-verification";
import { actorFromSession, logEvent } from "@/lib/logger";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : "";
  const avatarUrl = typeof body?.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 300) : "";
  const companyName =
    typeof body?.companyName === "string" ? sanitizePlainText(body.companyName).slice(0, 150) : "";
  const nationalId =
    typeof body?.nationalId === "string" ? sanitizePlainText(body.nationalId).slice(0, 50) : "";

  const current = await prisma.user.findUnique({ where: { id: session.user.id } });

  // Only spends a new api.ir call when nationalId actually changed (or
  // wasn't verified yet) — re-checking on every unrelated profile save
  // (e.g. just editing a phone number) would burn a paid lookup for
  // nothing. Same "never trust the client, always re-verify server-side"
  // rule as registration (see src/app/api/auth/register/route.ts).
  const nationalIdChanged = nationalId !== (current?.nationalId ?? "");
  const shouldVerify = !!nationalId && (nationalIdChanged || !current?.nationalIdVerified);
  const { outcome, fields } = shouldVerify
    ? await verifyNationalId(nationalId)
    : nationalId
      ? { outcome: null, fields: null } // unchanged + already verified — leave the 4 columns as they are
      : await verifyNationalId(null); // cleared to empty — reset all 4 columns

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      avatarUrl: avatarUrl || null,
      companyName: companyName || null,
      ...(fields ?? { nationalId: nationalId || null }),
    },
  });

  if (outcome) {
    await logEvent({
      actor: actorFromSession(session),
      action: outcome.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
      target: { type: "user", id: user.id, label: `ویرایش پروفایل «${user.companyName ?? user.email}»` },
      summary: summarizeOutcome(outcome),
    });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      companyName: user.companyName,
      nationalId: user.nationalId,
      nationalIdVerified: user.nationalIdVerified,
      nationalIdOfficialName: user.nationalIdOfficialName,
    },
  });
}
