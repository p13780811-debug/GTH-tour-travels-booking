# GTH PRO official email centralization

All public support, contact and legal emails and Organization JSON-LD use SITE_CONFIG in
src/lib/site-config.ts. Default official address: official@gthproglobal.com.

NEXT_PUBLIC_SUPPORT_EMAIL is an optional public setting. Only custom-domain
addresses at gthproglobal.com are accepted; invalid or personal mailbox
values fall back to the official address. See .env.example for the template.

Updated: Contact, About, Partners, shared Ecosystem Footer, Organization JSON-LD,
Privacy Policy, Terms & Conditions, Refund Policy and Affiliate Disclosure.
Existing user-submitted partner emails, auth identities, enquiry and CRM fields
are unchanged. No shared root layout or global CSS changes are required.

The entire tracked repository is guarded against legacy personal-mail domains
by tests/site-email-centralization.test.mjs.

Public mailto contact migration does not configure authenticated Zoho SMTP or
automatic notification sending. Existing partner and property enquiry APIs
continue recording submissions through the secure database.

Do not individually deploy this work; respect the one-shot release policy.
