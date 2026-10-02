import { prisma } from "@/lib/prisma";

export type RecipientAddressSnapshot = {
  address: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
};

// Snapshots the customer's current default address onto a new order at
// creation time — orders never live-reference UserAddress (see the schema
// comment on Order.recipientAddress), so a later address edit can't rewrite
// where an already-placed order says it was shipped. Falls back to the
// scalar User.address (text only, no postal code/coords) for a user with no
// saved UserAddress row, and to all-nulls for one with neither — the
// courier/customer UI shows "ثبت نشده" in that case.
export async function snapshotRecipientAddress(userId: string): Promise<RecipientAddressSnapshot> {
  const defaultAddress = await prisma.userAddress.findFirst({
    where: { userId, isDefault: true },
    select: { address: true, postalCode: true, lat: true, lng: true },
  });
  if (defaultAddress) {
    return {
      address: defaultAddress.address,
      postalCode: defaultAddress.postalCode,
      lat: defaultAddress.lat,
      lng: defaultAddress.lng,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { address: true } });
  return { address: user?.address ?? null, postalCode: null, lat: null, lng: null };
}
