export const LEAD_INTENTS = ["brochure_download", "site_visit", "pricing_enquiry"] as const
export type LeadIntent = typeof LEAD_INTENTS[number]
export const UNIT_CHOICES = ["Not decided", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5+ BHK", "Commercial"] as const
export const BUDGET_CHOICES = ["Not decided", "Under ₹50 lakh", "₹50 lakh–₹1 crore", "₹1–₹2 crore", "₹2–₹5 crore", "Above ₹5 crore"] as const
export type PropertyLeadTarget = { id: number; title: string; slug: string; rera_id?: string }
export type PropertyDocument = { title: string; kind: "brochure" | "floor_plan"; url: string }
export type BuyerLead = { propertyId: number; fullName: string; phone: string; email: string | null; preferredUnit: string; budgetRange: string | null; intent: LeadIntent; requestId: string }
const plain = (value: unknown, max: number) => {
  if (typeof value !== "string") return ""
  const normalized = value.normalize("NFKC").trim()
  return normalized.length <= max && !/[<>\u0000-\u001f\u007f]/.test(normalized) ? normalized : ""
}
export function indianPhone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 24 || !/^\+?[\d ()-]+$/.test(value)) return null
  let digits = value.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2)
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}
export function validateBuyerLead(body: Record<string, unknown>): BuyerLead {
  const propertyId = typeof body.property_id === "number" || (typeof body.property_id === "string" && /^[1-9]\d*$/.test(body.property_id)) ? Number(body.property_id) : NaN
  const fullName = plain(body.full_name, 150)
  const phone = indianPhone(body.phone)
  const email = body.email === "" || body.email == null ? null : plain(body.email, 150).toLowerCase()
  const preferredUnit = plain(body.preferred_unit, 50)
  const budgetRange = body.budget_range === "" || body.budget_range == null ? null : plain(body.budget_range, 50)
  const intent = body.intent_type
  const requestId = plain(body.request_id, 36)
  if (!Number.isSafeInteger(propertyId) || propertyId <= 0 || fullName.length < 2 || !phone ||
      (email !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) ||
      !UNIT_CHOICES.some(unit => unit === preferredUnit) ||
      (budgetRange !== null && !BUDGET_CHOICES.some(budget => budget === budgetRange)) ||
      !LEAD_INTENTS.some(item => item === intent) || body.consent_to_contact !== true || body.website_check ||
      !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(requestId)) throw new Error("Complete your name, a valid Indian mobile number and contact consent.")
  return { propertyId, fullName, phone, email, preferredUnit, budgetRange, intent: intent as LeadIntent, requestId }
}
export function safePropertyDocument(value: unknown): PropertyDocument | null {
  if (!value || typeof value !== "object") return null
  const row = value as Record<string, unknown>
  if (row.kind !== "brochure" && row.kind !== "floor_plan") return null
  const title = plain(row.title, 150)
  if (!title || typeof row.url !== "string" || row.url.length > 2048) return null
  try { const u = new URL(row.url); if (u.protocol !== "https:" || u.username || u.password || u.port || !u.hostname.includes(".") || /(?:^|\.)(?:localhost|local)$/.test(u.hostname) || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || !/\.pdf$/i.test(u.pathname)) return null; return { title, kind: row.kind, url: u.toString() } } catch { return null }
}
