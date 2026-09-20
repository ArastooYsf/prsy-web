// Builds a link to the pre-filled "new ticket" form (/account/tickets/new)
// — the one mechanism this site has for a customer-initiated request that
// needs a human reply (price quote, contract, stock/supply request, ...).
// There's no ticket "category" field; the subject line is what distinguishes
// these flows on the support side, so callers should keep subjects specific.
export function buildTicketHref(subject: string, message: string): string {
  return `/account/tickets/new?subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(message)}`;
}
