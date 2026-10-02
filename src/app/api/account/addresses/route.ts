import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizePlainText } from "@/lib/sanitize";
import { syncDefaultAddress } from "@/lib/user-contacts";

const MAX_LABEL_LENGTH = 40;
const MAX_ADDRESS_LENGTH = 500;
const MAX_FIELD_LENGTH = 150;

// Structured fields are all optional — a user can save an address without
// ever touching the map, or edit only the free-text parts. Each is just a
// short sanitized string, same treatment as `label`.
function optionalField(value: unknown, maxLength = MAX_FIELD_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const cleaned = sanitizePlainText(value).slice(0, maxLength);
  return cleaned || null;
}

function optionalCoordinate(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value >= min && value <= max ? value : null;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const addresses = await prisma.userAddress.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز است." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const address = typeof body?.address === "string" ? sanitizePlainText(body.address).slice(0, MAX_ADDRESS_LENGTH) : "";
  const label = typeof body?.label === "string" ? sanitizePlainText(body.label).slice(0, MAX_LABEL_LENGTH) : null;

  if (!address) {
    return NextResponse.json({ error: "آدرس نمی‌تواند خالی باشد." }, { status: 400 });
  }

  const province = optionalField(body?.province);
  const city = optionalField(body?.city);
  const street = optionalField(body?.street, MAX_ADDRESS_LENGTH);
  const plaque = optionalField(body?.plaque, 30);
  const postalCode = optionalField(body?.postalCode, 20);
  const lat = optionalCoordinate(body?.lat, -90, 90);
  const lng = optionalCoordinate(body?.lng, -180, 180);

  // Same "first one becomes default automatically" reasoning as the phone
  // route — see src/app/api/account/phones/route.ts.
  const existingCount = await prisma.userAddress.count({ where: { userId: session.user.id } });

  const created = await prisma.userAddress.create({
    data: {
      userId: session.user.id,
      address,
      label: label || null,
      province,
      city,
      street,
      plaque,
      postalCode,
      lat,
      lng,
      isDefault: existingCount === 0,
    },
  });

  if (existingCount === 0) {
    await syncDefaultAddress(session.user.id);
  }

  return NextResponse.json({ address: created });
}
