import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// One flat set of boolean columns on User (see prisma/schema.prisma) rather
// than a separate preferences table — a handful of per-user switches with no
// history/audit need, so a join table would only add query overhead for no
// real benefit. Every field is optional in the request body: the settings
// page only ever sends the toggles relevant to the caller's own role (see
// NotificationSettings.tsx), and a field a role doesn't apply to is simply
// never read on that role (src/lib/notifications/events.ts), so accepting
// (but ignoring the effect of) an out-of-role field here is harmless.
const BOOLEAN_FIELDS = [
  "notifyEmail",
  "notifySms",
  "notifyTicketReply",
  "notifyOrderStatus",
  "notifyContractExpiry",
  "notifyStaffNewMessage",
] as const;

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const data: Partial<Record<(typeof BOOLEAN_FIELDS)[number], boolean>> = {};
  for (const field of BOOLEAN_FIELDS) {
    if (typeof body[field] === "boolean") {
      data[field] = body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "هیچ مقدار معتبری ارسال نشده است." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: {
      notifyEmail: true,
      notifySms: true,
      notifyTicketReply: true,
      notifyOrderStatus: true,
      notifyContractExpiry: true,
      notifyStaffNewMessage: true,
    },
  });

  return NextResponse.json({ preferences: user });
}
