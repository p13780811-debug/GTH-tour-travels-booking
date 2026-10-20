/** Existing optional GA4 integration only: no new tag, PII, cookies or network requests. */
export const RE_EVENT_NAMES = ["property_search","property_filter","property_compare","property_shortlist","property_enquiry_open","property_enquiry_success","property_enquiry_failure"] as const
export type RealEstateEvent = typeof RE_EVENT_NAMES[number]
type Context = { type?: "advanced"|"intent"|"pricing_enquiry"|"brochure_download"|"site_visit"|"save"|"remove"|"select" }
export function trackRealEstateEvent(name: RealEstateEvent, context: Context = {}): void {
 if (typeof window === "undefined" || !RE_EVENT_NAMES.includes(name)) return
 const gtag = (window as Window & { gtag?: (...args: unknown[])=>void }).gtag
 if (typeof gtag !== "function") return
 const allowed = ["advanced","intent","pricing_enquiry","brochure_download","site_visit","save","remove","select"]
 const payload: Record<string,string> = {event_category:"real_estate"}
 if (context.type && allowed.includes(context.type)) payload.interaction_type = context.type
 try { gtag("event",name,payload) } catch { /* Analytics must never block buyer interactions. */ }
}
