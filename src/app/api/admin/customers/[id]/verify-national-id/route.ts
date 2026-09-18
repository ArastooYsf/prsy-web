import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actorFromSession, logEvent } from "@/lib/logger";
import { verifyNationalId, summarizeOutcome } from "@/lib/national-id-verification";

// Manual "تلاش مجدد استعلام" (retry inquiry) for the advisory list at
// /account/admin/customers/pending — for a LEGAL customer whose automatic
// check at registration/save time failed (invalid ID at the time, api.ir
// unreachable, dissolved company, etc). This never blocks the account
// either; it only updates the same nationalId* fields every other inquiry
// path writes.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT")) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const customer = await prisma.user.findFirst({
    where: { id: params.id, role: "CUSTOMER", customerType: "LEGAL", deletedAt: null },
  });
  if (!customer) {
    return NextResponse.json({ error: "مشتری حقوقی یافت نشد." }, { status: 404 });
  }
  if (!customer.nationalId) {
    return NextResponse.json({ error: "این مشتری شناسه ملی ثبت‌شده‌ای ندارد." }, { status: 400 });
  }

  const { outcome, fields } = await verifyNationalId(customer.nationalId);

  const updated = await prisma.user.update({ where: { id: customer.id }, data: fields });

  await logEvent({
    actor: actorFromSession(session),
    action: outcome!.verified ? "national_id_inquiry_success" : "national_id_inquiry_failed",
    target: { type: "customer", id: customer.id, label: `مشتری «${customer.companyName ?? customer.email}» (تلاش مجدد)` },
    summary: summarizeOutcome(outcome!),
  });

  if (!outcome!.verified) {
    return NextResponse.json({ error: outcome!.message }, { status: 422 });
  }

  return NextResponse.json({ customer: { id: updated.id, nationalIdVerified: updated.nationalIdVerified } });
}
