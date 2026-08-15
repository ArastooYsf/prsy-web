import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTwoFactorSecret, twoFactorQrCodeDataUrl } from "@/lib/twofactor";

// Generates a new secret but does NOT persist it — the secret only gets
// saved (in /confirm) once the user proves they can produce a valid code
// from it, so a setup that's started and abandoned never locks anything in.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const secret = createTwoFactorSecret();
  const qrCodeDataUrl = await twoFactorQrCodeDataUrl(session.user.email ?? "", secret);

  return NextResponse.json({ secret, qrCodeDataUrl });
}
