import { randomInt } from "crypto";

// 4-digit code the customer reads/shows to the courier on arrival; the
// courier (or admin) submits it back to confirm delivery. Same
// crypto.randomInt approach as generateVerificationCode() in
// email-verification.ts — a predictable RNG would undermine the
// already-small keyspace this code relies on.
export function generateDeliveryCode(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}
