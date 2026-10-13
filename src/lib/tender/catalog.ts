import { createClient } from "@supabase/supabase-js";
import type { TenderRequirements } from "@/lib/tender/eligibility";

export const TENDER_SECTORS = ["works", "goods", "services", "consultancy", "other"] as const;
export type TenderSector = typeof TENDER_SECTORS[number];
const PUBLIC_COLUMNS = "id,title,buyer,country_code,region,sector,summary,deadline_at,published_at,estimated_value,currency,source_name,source_reference,source_url,eligibility_requirements,requirements_verified";
const PAGE_SIZE = 12;

export type PublicTender = {
  id: string; title: string; buyer: string; country_code: string; region: string | null;
  sector: TenderSector; summary: string | null; deadline_at: string; published_at: string | null;
  estimated_value: number | null; currency: string | null; source_name: string;
  source_reference: string; source_url: string;
  eligibility_requirements: TenderRequirements; requirements_verified: boolean;
};
export type TenderFilters = { q: string; country: string; sector: string; page: number };
export type TenderResult =
 | { ok: true; items: PublicTender[]; total: number; page: number; size: number }
 | { ok: false; status: number; error: string };

export function parseTenderFilters(params: URLSearchParams):
 | { ok: true; filters: TenderFilters }
 | { ok: false; error: string } {
  const q = (params.get("q") ?? "").trim();
  const country = (params.get("country") ?? "").trim().toUpperCase();
  const sector = (params.get("sector") ?? "").trim().toLowerCase();
  const rawPage = params.get("page") ?? "1";
  if (q.length > 100 || /[\u0000-\u001f]/.test(q)) return { ok: false, error: "Invalid search" };
  if (country && !/^[A-Z]{2}$/.test(country)) return { ok: false, error: "Country must be a two-letter ISO code" };
  if (sector && !TENDER_SECTORS.includes(sector as TenderSector)) return { ok: false, error: "Invalid sector" };
  if (!/^[1-9]\d{0,2}$/.test(rawPage) || Number(rawPage) > 100)
    return { ok: false, error: "Invalid page" };
  return { ok: true, filters: { q, country, sector, page: Number(rawPage) } };
}

export function safeTenderSource(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port ||
        u.hostname === "localhost" || u.hostname.endsWith(".localhost") ||
        /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname.includes(":") ||
        !u.hostname.includes(".") ) return null;
    return u.toString();
  } catch { return null; }
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  }) : null;
}

export async function searchPublicTenders(filters: TenderFilters): Promise<TenderResult> {
  const db = publicClient();
  if (!db) return { ok: false, status: 503, error: "Tender catalog is not configured" };
  try {
    let query = db.from("tenders").select(PUBLIC_COLUMNS, { count: "exact" })
      .eq("status", "published").eq("source_verified", true).eq("is_public", true)
      .gt("deadline_at", new Date().toISOString());
    if (filters.country) query = query.eq("country_code", filters.country);
    if (filters.sector) query = query.eq("sector", filters.sector);
    if (filters.q) {
      // Escape PostgREST ILIKE wildcard characters, so user text remains literal.
      const escaped = filters.q.replace(/[\\%_]/g, (c) => "\\" + c);
      query = query.ilike("title", "%" + escaped + "%");
    }
    const offset = (filters.page - 1) * PAGE_SIZE;
    const { data, error, count } = await query
      .order("deadline_at", { ascending: true }).order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) return { ok: false, status: 503, error: "Tender catalog unavailable" };
    return { ok: true, items: (data ?? []) as PublicTender[], total: count ?? 0, page: filters.page, size: PAGE_SIZE };
  } catch { return { ok: false, status: 503, error: "Tender catalog unavailable" }; }
}

export async function getPublicTender(id: string):
 Promise<{ok:true;item:PublicTender|null}|{ok:false;status:number;error:string}> {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))
    return { ok: false, status: 400, error: "Invalid tender ID" };
  const db = publicClient();
  if (!db) return { ok: false, status: 503, error: "Tender catalog is not configured" };
  try {
    const { data, error } = await db.from("tenders").select(PUBLIC_COLUMNS)
      .eq("id", id).eq("status", "published").eq("source_verified", true).eq("is_public", true)
      .gt("deadline_at", new Date().toISOString()).maybeSingle();
    if (error) return {ok:false,status:503,error:"Tender catalog unavailable"};
    return {ok:true,item:data as PublicTender | null};
  } catch {return {ok:false,status:503,error:"Tender catalog unavailable"};}
}
