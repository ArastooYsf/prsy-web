// Shared "Name (contact)" label for admin pickers (customer/courier selects
// in OrderForm) — falls back to just the contact value when there's no name.
export function formatUserLabel(user: { name: string | null; email: string; phone?: string | null }, options?: { preferPhone?: boolean }): string {
  const contact = (options?.preferPhone && user.phone) || user.email;
  return user.name ? `${user.name} (${contact})` : contact;
}
