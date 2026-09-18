import { getFooterContact } from "@/lib/site-content";

// Same identity shown in the site header/footer (src/components/ui/header-2.tsx,
// src/components/Footer.tsx) and the official registration number quoted on
// the About page (src/components/About.tsx) — kept here as the single source
// for generated documents rather than re-deriving it from those components.
export const COMPANY_NAME = "پویش راه صنعت یاشار";
export const COMPANY_REGISTRATION_NUMBER = "۴۷۶۰۶";

export type CompanyProfile = {
  name: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const footer = await getFooterContact();
  return {
    name: COMPANY_NAME,
    registrationNumber: COMPANY_REGISTRATION_NUMBER,
    address: footer.address,
    phone: footer.phone,
    email: footer.email,
  };
}
