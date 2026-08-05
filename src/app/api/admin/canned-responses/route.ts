import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const responses = await prisma.cannedResponse.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ responses });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? sanitizePlainText(body.title).slice(0, 100) : "";
  const responseBody = typeof body?.body === "string" ? sanitizePlainText(body.body).slice(0, 2000) : "";

  if (!title || !responseBody) {
    return NextResponse.json({ error: "عنوان و متن پاسخ آماده الزامی هستند." }, { status: 400 });
  }

  const response = await prisma.cannedResponse.create({
    data: { title, body: responseBody, createdById: session.user.id },
  });

  return NextResponse.json({ response });
}
