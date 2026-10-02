import { prisma } from "@/lib/prisma";

// `User.phone`/`User.address` stay as plain scalar columns (see the schema
// comment on the `phones`/`addresses` relations) so every existing reader —
// SMS notifications, PDF documents, admin customer screens, order creation —
// keeps working unchanged, always seeing "whichever saved entry is
// currently the default" without needing to know the UserPhone/UserAddress
// tables exist. These two helpers are the only place that writes that sync;
// call after any add/delete/set-default on either table.
export async function syncDefaultPhone(userId: string): Promise<void> {
  const current = await prisma.userPhone.findFirst({
    where: { userId, isDefault: true },
    select: { phone: true },
  });
  await prisma.user.update({ where: { id: userId }, data: { phone: current?.phone ?? null } });
}

export async function syncDefaultAddress(userId: string): Promise<void> {
  const current = await prisma.userAddress.findFirst({
    where: { userId, isDefault: true },
    select: { address: true },
  });
  await prisma.user.update({ where: { id: userId }, data: { address: current?.address ?? null } });
}
