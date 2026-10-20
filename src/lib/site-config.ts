import { PRIMARY_ORIGIN } from "@/lib/seo/site";

/** Official public GTH PRO identity. Never fall back to a personal mailbox. */
export const DEFAULT_OFFICIAL_EMAIL = "official@gthproglobal.com";

function officialDomainEmail(value: string | undefined): string {
  const candidate = value?.trim().toLowerCase();
  return candidate && /^[a-z0-9._%+-]+@gthproglobal\.com$/.test(candidate)
    ? candidate : DEFAULT_OFFICIAL_EMAIL;
}

const contactEmail = officialDomainEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);

export const SITE_CONFIG = Object.freeze({
  name: "GTH PRO",
  domain: PRIMARY_ORIGIN,
  supportEmail: contactEmail,
  contactEmail,
  legalEmail: contactEmail,
});
