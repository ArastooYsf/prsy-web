import type { Prisma } from "@/generated/prisma/client";
import { getCompanyInfo, isValidNationalIdFormat, type CompanyInfoResponse } from "@/lib/integrations/api-ir";

// Business-rule layer on top of the raw api.ir envelope (src/lib/integrations/api-ir.ts
// stays a faithful, schema-exact client with no opinions of its own). Every
// nationalId-persisting route (register, profile, admin customer
// create/edit, admin retry) goes through this so "what counts as verified"
// and "what counts as a dissolved-company warning" can never drift between
// them.
export type NationalIdVerificationOutcome = {
  /** true iff api.ir returned real company data (regardless of active/dissolved) — this is what nationalIdVerified persists as. */
  verified: boolean;
  officialName: string | null;
  companyType: string | null;
  active: boolean | null;
  /** active === false OR endDate is set — a real company was found, but it's not currently active. Never blocks anything on its own; callers surface it as an advisory warning. */
  dissolved: boolean;
  /** Persian, safe to show a user directly: api.ir's own message on failure, or a dissolved-company notice on a "successful but inactive" lookup. Null on a clean active-company success. */
  message: string | null;
};

export function interpretCompanyInfo(response: CompanyInfoResponse): NationalIdVerificationOutcome {
  if (!response.success || !response.data) {
    return {
      verified: false,
      officialName: null,
      companyType: null,
      active: null,
      dissolved: false,
      message: response.message?.trim() || "استعلام شناسه ملی ناموفق بود.",
    };
  }

  const { name, companyType, active, endDate } = response.data;
  const dissolved = active === false || !!endDate;

  return {
    verified: true,
    officialName: name,
    companyType,
    active,
    dissolved,
    message: dissolved
      ? `طبق استعلام رسمی، این شرکت غیرفعال یا منحل‌شده است${endDate ? ` (تاریخ انحلال: ${endDate})` : ""}.`
      : null,
  };
}

/** The one human-readable log summary for a national-ID inquiry outcome — every nationalId-persisting route's logEvent call uses this instead of hand-copying the wording. */
export function summarizeOutcome(outcome: NationalIdVerificationOutcome): string | undefined {
  return outcome.verified
    ? `نام رسمی: «${outcome.officialName ?? "—"}» — وضعیت: ${outcome.active ? "فعال" : "غیرفعال/منحل‌شده"}`
    : (outcome.message ?? undefined);
}

/**
 * Prisma `where` clause for "LEGAL customer needing manual review" — either
 * the last automatic api.ir inquiry didn't succeed, or it succeeded but
 * found the company inactive/dissolved. Shared by the customers list page's
 * badge count and the dedicated pending-review list so the two can never
 * silently drift apart.
 */
export const LEGAL_CUSTOMER_NEEDS_REVIEW_WHERE: Prisma.UserWhereInput = {
  role: "CUSTOMER",
  customerType: "LEGAL",
  deletedAt: null,
  OR: [{ nationalIdVerified: false }, { nationalIdActive: false }],
};

/** Prisma-ready shape for the four nationalId* columns on User (see prisma/schema.prisma). */
export type NationalIdFields = {
  nationalId: string | null;
  nationalIdVerified: boolean;
  nationalIdOfficialName: string | null;
  nationalIdActive: boolean | null;
  nationalIdCheckedAt: Date | null;
};

/**
 * The one function every nationalId-persisting route calls: runs the real
 * api.ir lookup (never trusts a client-supplied result — see
 * NationalIdInquiryField's own doc comment) and returns both the
 * interpreted outcome (for logging/messaging) and the exact fields to write
 * to the User row. Pass `null` for a customer with no nationalId at all
 * (e.g. switching back to INDIVIDUAL) to get a clean "unset" fields object.
 */
export async function verifyNationalId(
  nationalId: string | null,
): Promise<{ outcome: NationalIdVerificationOutcome | null; fields: NationalIdFields }> {
  if (!nationalId) {
    return {
      outcome: null,
      fields: { nationalId: null, nationalIdVerified: false, nationalIdOfficialName: null, nationalIdActive: null, nationalIdCheckedAt: null },
    };
  }

  // Fail fast on a malformed ID (not 11 digits) before spending a real,
  // billed api.ir call — this used to only guard the anonymous preview
  // endpoint (src/app/api/legal-entity/inquire/route.ts calls the same
  // isValidNationalIdFormat directly), leaving every authoritative
  // persisting caller (register, profile, admin create/edit, admin retry)
  // able to burn a paid lookup on input that can't possibly be valid.
  // Centralizing it here means every one of them is covered automatically.
  if (!isValidNationalIdFormat(nationalId)) {
    const outcome: NationalIdVerificationOutcome = {
      verified: false,
      officialName: null,
      companyType: null,
      active: null,
      dissolved: false,
      message: "شناسه ملی باید دقیقاً ۱۱ رقم باشد.",
    };
    return {
      outcome,
      fields: { nationalId, nationalIdVerified: false, nationalIdOfficialName: null, nationalIdActive: null, nationalIdCheckedAt: new Date() },
    };
  }

  const response = await getCompanyInfo(nationalId);
  const outcome = interpretCompanyInfo(response);

  return {
    outcome,
    fields: {
      nationalId,
      nationalIdVerified: outcome.verified,
      nationalIdOfficialName: outcome.officialName,
      nationalIdActive: outcome.active,
      nationalIdCheckedAt: new Date(),
    },
  };
}
