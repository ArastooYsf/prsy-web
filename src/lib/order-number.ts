// Shared by both order-creation paths (admin's manual entry and the
// customer's self-service checkout) so every order number follows the same
// format regardless of who created it.
export function generateOrderNumber(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}
