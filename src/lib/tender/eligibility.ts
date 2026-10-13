/** Conservative, source-first tender eligibility and bid-packet engine.
 * Requirements are not inferred from industry, country, AI, or estimated value.
 * Always compare against official published tender conditions.
 */
export type TenderRequirements = {
  min_experience_years?: number | null;
  min_annual_turnover?: number | null;
  turnover_currency?: string | null;
  eligible_countries?: string[];
  required_registrations?: string[];
  required_documents?: string[];
  notes?: string;
};
export type BidderProfile = {
  business_name: string;
  business_country: string;
  contact_name: string;
  years_experience: string;
  annual_turnover: string;
  turnover_currency: string;
  registrations: string;
  available_documents: string;
  capability_statement: string;
};
export type EligibilityCheck = { label: string; result: "meets" | "gap" | "unknown"; detail: string };
export type EligibilityReport = {
  status: "insufficient_criteria" | "needs_review" | "not_meeting_stated_conditions" | "potential_match";
  checks: EligibilityCheck[];
  warning: string;
};
export const EMPTY_PROFILE: BidderProfile = {
  business_name: "", business_country: "", contact_name: "", years_experience: "",
  annual_turnover: "", turnover_currency: "", registrations: "", available_documents: "",
  capability_statement: "",
};
export const EMPTY_REQUIREMENTS: TenderRequirements = {
  min_experience_years: null, min_annual_turnover: null, turnover_currency: "",
  eligible_countries: [], required_registrations: [], required_documents: [], notes: "",
};
const splitTerms = (s: string) => s.split(/[\n,;]/g).map(x=>x.trim().toLowerCase()).filter(Boolean);
const num = (value: string): number | null => {
  if (!value.trim() || !/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
};
function norm(s: string) { return s.trim().toLowerCase(); }

export function evaluateEligibility(profile: BidderProfile, requirements: TenderRequirements, criteriaVerified: boolean): EligibilityReport {
  const checks: EligibilityCheck[] = [];
  const hasCriteria = requirements.min_experience_years != null ||
    requirements.min_annual_turnover != null ||
    Boolean(requirements.eligible_countries?.length) ||
    Boolean(requirements.required_registrations?.length) ||
    Boolean(requirements.required_documents?.length);
  const warning = "Informational screening only. This is not an eligibility certificate or a bid approval. Consult the latest official tender document, corrigenda and authority.";

  if (!hasCriteria) return { status: "insufficient_criteria", checks, warning };
  if (requirements.min_experience_years != null) {
    const years = num(profile.years_experience);
    checks.push({label:"Minimum experience",result:years == null ? "unknown" : years >= requirements.min_experience_years ? "meets" : "gap",
      detail:years == null ? "Enter verifiable years of experience." : `Declared ${years}; required ${requirements.min_experience_years} years.`});
  }
  if (requirements.min_annual_turnover != null) {
    const declared = num(profile.annual_turnover);
    const unit = (requirements.turnover_currency || "").toUpperCase();
    const sameUnit = Boolean(unit) && profile.turnover_currency.trim().toUpperCase() === unit;
    checks.push({label:"Minimum annual turnover", result:declared==null || !sameUnit ? "unknown" : declared >= requirements.min_annual_turnover ? "meets" : "gap",
      detail:!sameUnit ? "Check currency and reporting period against the notice; no automatic currency conversion." :
        declared==null ? "Enter verified annual turnover." : `Declared ${declared} ${unit}; required ${requirements.min_annual_turnover} ${unit}.`});
  }
  const countryCodes=(requirements.eligible_countries||[]).map(c=>c.toUpperCase());
  if(countryCodes.length) {
    const c=profile.business_country.trim().toUpperCase();
    checks.push({label:"Eligible business country", result:!c ? "unknown" : countryCodes.includes(c) ? "meets" : "gap",
      detail:!c?"Enter your registration country (two-letter ISO code).":`Declared ${c}; source conditions: ${countryCodes.join(", ")}.`});
  }
  for(const registration of requirements.required_registrations||[]) {
    const declared=splitTerms(profile.registrations);
    // A free-text self-declaration is not document verification; only a provisional match.
    checks.push({label:`Registration: ${registration}`, result:!profile.registrations.trim() ? "unknown" : declared.includes(norm(registration)) ? "meets" : "gap",
      detail:"Compare exact registration and its validity against the official eligibility clause."});
  }
  for(const document of requirements.required_documents||[]) {
    const declared=splitTerms(profile.available_documents);
    checks.push({label:`Document: ${document}`, result:!profile.available_documents.trim() ? "unknown" : declared.includes(norm(document)) ? "meets" : "gap",
      detail:"User-declared document; inspect validity, format, signatures and expiry before bidding."});
  }
  if(!criteriaVerified) return {status:"needs_review",checks,warning:"Requirements are user-entered or not independently verified. No eligibility decision can be made. "+warning};
  if(checks.some(c=>c.result==="gap")) return {status:"not_meeting_stated_conditions",checks,warning};
  if(checks.some(c=>c.result==="unknown")) return {status:"needs_review",checks,warning};
  return {status:"potential_match",checks,warning:"Potential match based on user-declared answers to reviewed criteria—not final eligibility. "+warning};
}

export function buildBidPacket(profile: BidderProfile, tender: {title?:string;buyer?:string;source_reference?:string}, requirements: TenderRequirements, report: EligibilityReport): string {
  const line = (v:string) => v.trim() || "[TO BE COMPLETED BY BIDDER]";
  const notice = line(tender.title||"");
  const buyer = line(tender.buyer||"");
  const docs=(requirements.required_documents||[]).map((x,i)=>`${i+1}. [ ] ${x}`).join("\n");
  const checklist=docs || "[ ] Review official tender document and record its actual mandatory attachments";
  const body=[
    "GTH PRO — BID PREPARATION DRAFT (NOT SUBMITTED)",
    "Verify every field and supporting document with the official tender notice before using this draft.",
    "",
    `Tender: ${notice}`,`Reference: ${line(tender.source_reference||"")}`,`Issuing authority: ${buyer}`,
    `Bidder / organisation: ${line(profile.business_name)}`,
    `Contact person: ${line(profile.contact_name)}`,
    `Country of registration: ${line(profile.business_country)}`,
    "",
    "PROPOSED COVER LETTER — EDIT BEFORE USE",
    `To: ${buyer}`,
    `Subject: Expression of interest / proposed response — ${notice}`,
    "",
    "Dear Procurement Team,",
    `We, ${line(profile.business_name)}, wish to express our interest in the referenced procurement opportunity, subject to our independent review of all eligibility, technical, financial and legal requirements.`,
    `Our relevant capabilities: ${line(profile.capability_statement)}`,
    "We will provide only independently verified statements and documents required by the latest official tender notice and any amendments.",
    "This text is a drafting aid and does not represent a signed bid, an offer price or evidence of eligibility.",
    `Contact: ${line(profile.contact_name)}`,
    "",
    "DOCUMENT CHECKLIST — confirm official format, dates and signatures",
    checklist,"",
    `SCREENING: ${report.status.replace(/_/g," ").toUpperCase()}`,
    ...report.checks.map(c=>`- ${c.label}: ${c.result.toUpperCase()} — ${c.detail}`),
    "",
    "FINAL ACTIONS (USER MUST COMPLETE)",
    "1. Re-read the original notice, annexures, addenda and eligibility terms.",
    "2. Confirm authorised portal, account registration and identity requirements.",
    "3. Fill the official portal fields yourself using only checked and approved answers.",
    "4. Upload signed/supporting documents through the authorised official interface.",
    "5. Verify prices, declarations and deadlines; pay official fees only on the authorised site.",
    "6. Preview and explicitly authorise final submission; retain official acknowledgment/receipt.",
    "GTH PRO cannot submit or claim an official tender application on your behalf.",
  ];
  return body.join("\n");
}
