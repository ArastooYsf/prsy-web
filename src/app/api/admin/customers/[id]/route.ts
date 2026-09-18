import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { isValidIranPhone } from "@/lib/validation";
import { actorFromSession, logEvent } from "@/lib/logger";
import { verifyNationalId, summarizeOutcome } from "@/lib/national-id-verification";
import type { User, CustomerType } from "@/generated/prisma/client";

// Fields an admin/support agent can change from the customer detail page —
// deliberately excludes email/password/role/approvalStatus, which already
// have their own dedicated flows (login credentials, role escalation) and
// shouldn't be casually bundled into a profile edit's before/after diff.
const EDITABLE_FIELD_LABELS: Partial<Record<keyof User, string>> = {
  name: "نام",
  phone: "تلفن",
  alternatePhone: "تلفن جایگزین",
  address: "آدرس",
  customerType: "نوع مشتری",
  companyName: "نام شرکت",
  nationalId: "شناسه ملی",
  notes: "یادداشت داخلی",
};

function diffSummary(before: User, after: Record<string, unknown>): string | null {
  const changes: string[] = [];
  for (const [field, label] of Object.entries(EDITABLE_FIELD_LABELS)) {
    const oldValue = (before as unknown as Record<string, unknown>)[field] ?? "";
    const newValue = after[field] ?? "";
    if (String(oldValue) !== String(newValue)) {
      changes.push(`${label}: از «${oldValue || "—"}» به «${newValue || "—"}»`);
    }
  }
  return changes.length > 0 ? changes.join(" | ") : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const existing = await prisma.user.findFirst({ where: { id: params.id, role: "CUSTOMER", deletedAt: null } });
  if (!existing) {
    return NextResponse.json({ error: "مشتری یافت نشد." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? sanitizePlainText(body.name).slice(0, 100) : "";
  const phone = typeof body?.phone === "string" ? sanitizePlainText(body.phone).slice(0, 30) : "";
  const alternatePhone =
    typeof body?.alternatePhone === "string" ? sanitizePlainText(body.alternatePhone).slice(0, 30) : "";
  const address = typeof body?.address === "string" ? sanitizePlainText(body.address).slice(0, 300) : "";
  const customerType: CustomerType = body?.customerType === "LEGAL" ? "LEGAL" : "INDIVIDUAL";
  const companyName =
    typeof body?.companyName === "string" ? sanitizePlainText(body.companyName).slice(0, 150) : "";
  const nationalId =
    typeof body?.nationalId === "string" ? sanitizePlainText(body.nationalId).slice(0, 50) : "";
  const notes = typeof body?.notes === "string" ? sanitizePlainText(body.notes).slice(0, 4000) : "";

  if (phone && !isValidIranPhone(phone)) {
    return NextResponse.json({ error: "شماره تلفن معتبر نیست." }, { status: 400 });
  }
  if (alternatePhone && !isValidIranPhone(alternatePhone)) {
    return NextResponse.json({ error: "شماره تماس جایگزین معتبر نیست." }, { status: 400 });
  }
  if (customerType === "LEGAL" && (!companyName.trim() || !nationalId.trim())) {
    return NextResponse.json({ error: "نام شرکت و شناسه ملی برای مشتری حقوقی الزامی است." }, { status: 400 });
  }

  // Same "only re-spend a paid api.ir call when nationalId actually
  // changed" rule as the self-service profile route.
  const nextNationalId = customerType === "LEGAL" ? nationalId || null : null;
  const nationalIdChanged = nextNationalId !== existing.nationalId;
  const shouldVerify = !!nextNationalId && (nationalIdChanged || !existing.nationalIdVerified);
  const { outcome, fields } = shouldVerify
    ? await verifyNationalId(nextNationalId)
    : nextNationalId
      ? { outcome: null, fields: null } // unchanged + already verified — leave the 4 columns as they are
      : await verifyNationalId(null); // switched away from LEGAL or cleared — reset all 4 columns

  // email is intentionally read-only here (see EDITABLE_FIELD_LABELS above),
  // so no uniqueness re-check is needed — it never changes through this route.
  const nextValues = {
    name: name || null,
    phone: phone || null,
    alternatePhone: alternatePhone || null,
    address: address || null,
    customerType,
    companyName: customerType === "LEGAL" ? companyName || null : null,
    ...(fields ?? { nationalId: nextNationalId }),
    notes: notes || null,
  };

  const summary = diffSummary(existing, nextValues);

  const customer = await prisma.user.update({ where: { id: existing.id }, data: nextValues });

  if (summary) {
    await logEvent({
      actor: actorFromSession(session),
      action: "update",
      target: { type: "customer", id: customer.id, label: `مشتری «${customer.name || customer.email}»` },
      summary,
    });
  }

  if (outcome) {
    await logEvent({
      actor: actorFromSession(session),
      action: outcome.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
      target: { type: "customer", id: customer.id, label: `مشتری «${customer.name || customer.email}»` },
      summary: summarizeOutcome(outcome),
    });
  }

  return NextResponse.json({ customer: { id: customer.id } });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", deletedAt: null },
  });
  if (!customer) {
    return NextResponse.json({ error: "مشتری یافت نشد." }, { status: 404 });
  }

  await prisma.user.update({ where: { id: customer.id }, data: { deletedAt: new Date() } });

  await logEvent({
    actor: actorFromSession(session),
    action: "delete",
    target: { type: "customer", id: customer.id, label: `مشتری «${customer.name || customer.email}»` },
  });

  return NextResponse.json({ ok: true });
}
