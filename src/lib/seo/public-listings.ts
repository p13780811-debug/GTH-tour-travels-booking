import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo/site";

// SEO copy is derived exclusively from public, published source facts.
// Do not infer Wi-Fi, luxury status, discounts, partner rates, or live availability.
export type HotelSeoRecord = {
  name: string; city: string | null; country: string | null; category: string;
  source: string; sourceUrl: string | null; partner: string | null;
};

export type TenderSeoRecord = {
  id: string; title: string; buyer: string; country_code: string;
  sector: string; summary: string | null; deadline_at: string;
  source_name: string; source_reference: string; source_url: string;
};

function clean(value: unknown, max = 160): string {
  return typeof value === "string"
    ? value.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}
function validHttps(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname.includes(".") &&
      !url.username && !url.password && !url.port &&
      url.hostname !== "localhost" && !url.hostname.endsWith(".localhost") &&
      !/^[0-9.]+$/.test(url.hostname) && !url.hostname.includes(":");
  } catch { return false; }
}
export function isIndexableHotel(item: HotelSeoRecord | null): boolean {
  // Only independently approved, source-attributed hotel partner rows.
  // OSM location-only directory data has no independently verified amenities/rates.
  return !!item && item.source !== "OpenStreetMap" &&
    clean(item.name, 140).length >= 5 && clean(item.city, 100).length >= 2 &&
    validHttps(item.sourceUrl) && validHttps(item.partner);
}
export function hotelMetadata(item: HotelSeoRecord | null, id: string, launched: boolean): Metadata {
  if (!item) return { title: "Hotel unavailable | GTH PRO", robots: { index: false, follow: false } };
  const name = clean(item.name, 78);
  const city = clean(item.city, 65);
  const where = [city, clean(item.country, 40)].filter(Boolean).join(", ");
  const title = `${name}${where ? ` in ${where}` : ""} | GTH PRO Hotels`;
  const description = `Explore ${name}${where ? ` in ${where}` : ""}. Review the attributed listing and check dates, room availability, final rates and booking conditions with the provider.`.slice(0, 280);
  const canonical = siteUrl(`/hotels/stay/${encodeURIComponent(id)}`);
  const index = launched && isIndexableHotel(item);
  return {
    title, description, alternates: { canonical },
    robots: { index, follow: index },
    openGraph: { title, description, url: canonical, type: "website", siteName: "GTH PRO" },
    twitter: { card: "summary", title, description },
  };
}
export function isIndexableTender(item: TenderSeoRecord | null, now = Date.now()): boolean {
  return !!item &&
    /^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(item.id) &&
    clean(item.title, 250).length >= 12 && clean(item.buyer, 200).length >= 3 &&
    clean(item.summary, 1000).length >= 90 && clean(item.source_reference, 180).length >= 3 &&
    clean(item.source_name, 120).length >= 3 && /^[A-Z]{2}$/.test(item.country_code) &&
    validHttps(item.source_url) && Number.isFinite(Date.parse(item.deadline_at)) &&
    Date.parse(item.deadline_at) > now;
}
export function tenderMetadata(item: TenderSeoRecord | null, id: string, launched: boolean): Metadata {
  if (!item) return { title: "Tender unavailable | GTH PRO", robots: { index: false, follow: false } };
  const name = clean(item.title, 88);
  const country = item.country_code === "IN" ? "India" : clean(item.country_code, 2);
  const source = clean(item.source_name, 45);
  const deadline = Number.isFinite(Date.parse(item.deadline_at)) ? new Date(item.deadline_at).toISOString().slice(0, 10) : "";
  const title = `${name} | ${source} Tender ${country} | GTH PRO`;
  const description = `${source} procurement notice ${clean(item.source_reference, 65)} by ${clean(item.buyer, 65)} in ${country}. ${deadline ? `Deadline: ${deadline}. ` : ""}${clean(item.summary, 150)}`.slice(0, 300);
  const canonical = siteUrl(`/tender/${encodeURIComponent(id)}`);
  const index = launched && isIndexableTender(item);
  return {
    title, description, alternates: { canonical },
    robots: { index, follow: index },
    openGraph: { title, description, url: canonical, type: "article", siteName: "GTH PRO" },
    twitter: { card: "summary", title, description },
  };
}
