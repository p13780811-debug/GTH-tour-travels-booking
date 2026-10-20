import type { PublicTender } from "./catalog";

export const TENDER_WORKSPACE_KEY = "gth-tender-discovery-v1";
export const MAX_SAVED_TENDERS = 40;
export const MAX_COMPARED_TENDERS = 3;
export const MAX_SAVED_SEARCHES = 8;
export const TENDER_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type SavedTenderSearch = { href: string; label: string };
export type TenderDiscoveryWorkspace = { version: 1; saved: string[]; comparison: string[]; searches: SavedTenderSearch[] };
export const EMPTY_TENDER_WORKSPACE: TenderDiscoveryWorkspace = { version: 1, saved: [], comparison: [], searches: [] };

/** Only known discovery parameters may become a saved internal navigation URL. */
export function safeTenderSearchHref(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 800 || !raw.startsWith("/tender?")) return null;
  const url = new URL(raw, "https://gth.invalid");
  if (url.origin !== "https://gth.invalid" || url.pathname !== "/tender" || url.hash) return null;
  const allowed = ["q", "country", "sector", "scope", "closingBefore", "closingWithin", "sort", "lang"];
  if ([...url.searchParams.keys()].some(key => !allowed.includes(key) || url.searchParams.getAll(key).length !== 1)) return null;
  const p = url.searchParams;
  const query = p.get("q") ?? "";
  if (query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) return null;
  if (p.has("country") && !/^[A-Z]{2}$/.test(p.get("country") ?? "")) return null;
  if (p.has("sector") && !["works", "goods", "services", "consultancy", "other"].includes(p.get("sector") ?? "")) return null;
  if (p.has("scope") && !["local", "world"].includes(p.get("scope") ?? "")) return null;
  if (p.has("sort") && !["deadline", "newest"].includes(p.get("sort") ?? "")) return null;
  if (p.has("closingWithin") && p.get("closingWithin") !== "7") return null;
  if (p.has("lang") && !/^(en|hi|bn|ta|te|mr|fr|es|pt|de|ar|uk|ru|zh|ja)$/.test(p.get("lang") ?? "")) return null;
  const date = p.get("closingBefore");
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date)) return null;
  p.sort();
  return "/tender?" + p.toString();
}

export function parseTenderWorkspace(raw: string | null): TenderDiscoveryWorkspace {
  if (!raw || raw.length > 16000) return EMPTY_TENDER_WORKSPACE;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) return EMPTY_TENDER_WORKSPACE;
    const v = value as Record<string, unknown>;
    const ids = (input: unknown, limit: number): string[] => Array.isArray(input)
      ? [...new Set(input.filter((id): id is string => typeof id === "string" && TENDER_ID.test(id)).map(id => id.toLowerCase()))].slice(0,limit) : [];
    const searches: SavedTenderSearch[] = [];
    if (Array.isArray(v.searches)) for (const entry of v.searches.slice(0,MAX_SAVED_SEARCHES)) {
      if (!entry || typeof entry !== "object") continue;
      const href = safeTenderSearchHref(entry.href);
      const label = typeof entry.label === "string" ? entry.label.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0,120) : "";
      if (href && label && !searches.some(search => search.href === href)) searches.push({href,label});
    }
    return { version: 1, saved: ids(v.saved,MAX_SAVED_TENDERS), comparison: ids(v.comparison,MAX_COMPARED_TENDERS), searches };
  } catch { return EMPTY_TENDER_WORKSPACE; }
}

export function toggleTenderId(ids: string[], id: string, limit: number): { ids: string[]; limitReached: boolean } {
  if (!TENDER_ID.test(id)) return {ids,limitReached:false};
  const normalized = id.toLowerCase();
  if (ids.includes(normalized)) return {ids:ids.filter(value => value !== normalized),limitReached:false};
  if (ids.length >= limit) return {ids,limitReached:true};
  return {ids:[...ids,normalized],limitReached:false};
}

/** Export only current public notice data, with spreadsheet-formula protection. */
export function buildTenderCsv(notices: PublicTender[]): string {
  const cell = (value: unknown) => {
    let text = String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
    if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g,'""') + '"';
  };
  const rows: unknown[][] = [["Title","Buyer","Country","Sector","Deadline UTC","Estimated value (not bid price)","Currency","Source","Reference","Official notice"]];
  for (const item of notices.slice(0,MAX_SAVED_TENDERS)) rows.push([
    item.title,item.buyer,item.country_code,item.sector,item.deadline_at,
    item.estimated_value,item.currency,item.source_name,item.source_reference,item.source_url,
  ]);
  return "\ufeff" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export function formatTenderBudget(value: number | null, currency: string | null, locale = "en"): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || !currency || !/^[A-Z]{3}$/.test(currency)) return "Not published";
  try { return new Intl.NumberFormat(locale,{style:"currency",currency,maximumFractionDigits:0}).format(value); }
  catch { return "Not published"; }
}
