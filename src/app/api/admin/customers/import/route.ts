import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Expected format: one header row, then "name,email,phone,notes" per line.
// Deliberately naive (no quoted-comma support) — matches the "simple CSV" ask.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const csv: string = typeof body?.csv === "string" ? body.csv : "";

  if (!csv.trim()) {
    return NextResponse.json({ error: "محتوای CSV خالی است." }, { status: 400 });
  }

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const rows = lines.slice(1); // first line is always treated as the header

  let created = 0;
  const skipped: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].split(",").map((c) => c.trim());
    const [rawName, rawEmail, rawPhone, rawNotes] = cells;
    const email = (rawEmail ?? "").toLowerCase();

    if (!EMAIL_RE.test(email)) {
      skipped.push({ row: i + 2, reason: "ایمیل نامعتبر" });
      continue;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      skipped.push({ row: i + 2, reason: "ایمیل تکراری" });
      continue;
    }

    const randomPassword = randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: rawName ? sanitizePlainText(rawName).slice(0, 100) : null,
        phone: rawPhone ? sanitizePlainText(rawPhone).slice(0, 30) : null,
        notes: rawNotes ? sanitizePlainText(rawNotes).slice(0, 4000) : null,
        role: "CUSTOMER",
        customerType: "INDIVIDUAL",
        approvalStatus: "APPROVED",
      },
    });
    created++;
  }

  return NextResponse.json({ created, skipped });
}
