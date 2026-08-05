import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? sanitizePlainText(body.subject).slice(0, 200) : "";
  const message = typeof body?.message === "string" ? sanitizePlainText(body.message).slice(0, 5000) : "";

  if (!subject || !message) {
    return NextResponse.json({ error: "موضوع و متن پیام الزامی هستند." }, { status: 400 });
  }

  const ticket = await prisma.ticket.create({
    data: { subject, message, userId: session.user.id },
  });

  return NextResponse.json({ ticket });
}
