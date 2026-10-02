import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidIranPhone } from "@/lib/validation";
import { syncDefaultPhone } from "@/lib/user-contacts";

const MAX_LABEL_LENGTH = 40;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const phones = await prisma.userPhone.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ phones });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const label = typeof body?.label === "string" ? sanitizePlainText(body.label).slice(0, MAX_LABEL_LENGTH) : null;

  if (!phone || !isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تماس معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹" }, { status: 400 });
  }

  // The first phone a customer ever saves becomes their default automatically
  // — otherwise a brand-new account would have an address book with nothing
  // selected, and nowhere else in the app (SMS, PDFs, checkout) would know
  // which one to use.
  const existingCount = await prisma.userPhone.count({ where: { userId: session.user.id } });

  const created = await prisma.userPhone.create({
    data: { userId: session.user.id, phone, label: label || null, isDefault: existingCount === 0 },
  });

  if (existingCount === 0) {
    await syncDefaultPhone(session.user.id);
  }

  return NextResponse.json({ phone: created });
}
