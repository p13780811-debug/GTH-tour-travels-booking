import "server-only";

import {createClient} from "@supabase/supabase-js";
import {unstable_cache} from "next/cache";
import {trackKlookDestination, buildPartnerSearch} from "@/lib/travel/partner-search";
import {GETYOURGUIDE_PARTNER_ID} from "@/lib/travel/cruise-provider-search";

type Group = "tours" | "activities";
type Product = {
  id: string;
  title: string;
  href: string;
  image: string | null;
  detail: string;
};

const exactKlook = /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?activity\/([1-9]\d*)-[a-z0-9-]+\/?$/;
const exactGuide = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?[a-z0-9-]+-l[1-9]\d*\/[a-z0-9-]+-t([1-9]\d*)\/?$/;
const locationPattern = /^[\p{L}\p{M}\p{N} .,'’()-]{2,100}$/u;

export function destinationProductLink(value: string) {
  const url = URL.parse(value);
  if (!url || url.search || url.hash || url.username || url.password) return null;

  if (url.origin === "https://www.klook.com") {
    const id = exactKlook.exec(url.pathname)?.[1];
    const href = id && trackKlookDestination(url, "gth_destination_" + id);
    return href ? {id: "klook-" + id, href} : null;
  }

  if (url.origin !== "https://www.getyourguide.com") return null;
  const id = exactGuide.exec(url.pathname)?.[1];
  if (!id) return null;
  url.searchParams.set("partner_id", GETYOURGUIDE_PARTNER_ID);
  url.searchParams.set("utm_medium", "online_publisher");
  url.searchParams.set("cmp", "gth_destination");
  return {id: "guide-" + id, href: url.href};
}

export function destinationExperienceLinks(city: string, country: string | null, group: Group) {
  const location = [city, country].filter(Boolean).join(" ");
  const guide = new URL("https://www.getyourguide.com/s/");
  guide.search = new URLSearchParams({
    q: location + " " + group,
    partner_id: GETYOURGUIDE_PARTNER_ID,
    utm_medium: "online_publisher",
    cmp: "gth_destination",
  }).toString();
  const exact = country === "India" && city.toLowerCase() === "goa" ? "c178-goa"
    : country === "India" && city.toLowerCase() === "mumbai" ? "c132-mumbai"
    : country === "United Kingdom" && city.toLowerCase() === "london" ? "c106-london"
    : country === "United Arab Emirates" && city.toLowerCase() === "dubai" ? "c78-dubai" : null;
  const klook = exact
    ? trackKlookDestination(new URL("https://www.klook.com/en-IN/destination/" + exact
        + (group === "tours" ? "/1001-tours/" : "/1-things-to-do/")), "gth_destination_" + group)
    : buildPartnerSearch({kind: group, destination: location});
  return {guide: guide.href, klook};
}

export function supplierPrice(price: unknown, currency: unknown): string | null {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0
      || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return null;
  return "From " + new Intl.NumberFormat("en-IN", {
    style: "currency", currency, maximumFractionDigits: 2,
  }).format(price);
}

// Checked public product pages. Product link entries carry no supplier rate
// snapshot or media entitlement. Those come from the approved catalog/feed.
const seed: readonly (readonly [string, string, Group, string, string])[] = [
  ["Mumbai", "India", "tours", "Elephanta Caves Half-Day Guided Tour", "https://www.klook.com/activity/117203-mumbai-elephanta-caves-half-day-guided-tour/"],
  ["Mumbai", "India", "tours", "Dharavi Walking Tour", "https://www.klook.com/en-IN/activity/5605-dharavi-slum-walking-tour-mumbai/"],
  ["Mumbai", "India", "tours", "Highlights of Mumbai Day Tour", "https://www.klook.com/en-IN/activity/5471-highlights-of-mumbai-tour-mumbai/"],
  ["Mumbai", "India", "activities", "Mumbai Bollywood Studio Tour", "https://www.klook.com/en-IN/activity/5790-bollywood-studio-tour-mumbai/"],
  ["Mumbai", "India", "activities", "Mumbai Unplugged Half-Day Experience", "https://www.klook.com/en-US/activity/5677-mumbai-unplugged-half-day-tour-india/"],
  ["Mumbai", "India", "activities", "Mumbai Private Yacht Sailing", "https://www.klook.com/en-US/activity/126834-sailing-on-compact-yacht/"],
  ["Goa", "India", "tours", "North Goa Tour by Luxury Coach", "https://www.klook.com/en-IN/activity/17261-north-luxury-coach-tour-goa/"],
  ["Goa", "India", "tours", "South Goa Tour by Luxury Coach", "https://www.klook.com/en-IN/activity/17259-south-luxury-coach-tour-goa/"],
  ["Goa", "India", "tours", "North Goa Private Day Tour", "https://www.klook.com/en-IN/activity/7261-north-goa-private-day-tour-goa/"],
  ["Goa", "India", "activities", "Mandovi Sunset Boat Party", "https://www.klook.com/en-IN/activity/117288-mandovi-sunset-boat-party/"],
  ["Goa", "India", "activities", "Vihaan Evening Dinner Cruise", "https://www.klook.com/en-IN/activity/185490-vihaan-evening-dinner-cruise-experience/"],
  ["Goa", "India", "activities", "Kayaking Experience in Goa", "https://www.klook.com/en-IN/activity/18757-kayaking-experience-goa/"],
  ["Dubai", "United Arab Emirates", "tours", "Red Dune Desert Safari", "https://www.klook.com/en-IN/activity/148810-best-red-dune-deluxe-desert-safari-in-dubai/"],
  ["Dubai", "United Arab Emirates", "tours", "Dubai Frame Half-Day City Highlights Tour", "https://www.klook.com/en-IN/activity/13229-half-day-city-tour-in-dubai/"],
  ["Dubai", "United Arab Emirates", "tours", "Al Ain City Tour from Dubai", "https://www.getyourguide.com/dubai-l173/from-dubai-al-ain-city-tour-t559171/"],
  ["Dubai", "United Arab Emirates", "activities", "Burj Khalifa Observation Deck Ticket", "https://www.klook.com/activity/2228-burj-khalifa-observation-deck-dubai/"],
  ["Dubai", "United Arab Emirates", "activities", "Zerzura Dune Buggy and Fossil Discovery from Dubai", "https://www.getyourguide.com/dubai-l173/from-dubai-zerzura-dune-buggy-experience-fossil-discovery-t603075/"],
  ["London", "United Kingdom", "tours", "Buckingham Palace, Westminster Abbey & Big Ben Tour", "https://www.getyourguide.com/london-l57/london-buckingham-palace-westminster-abbey-big-ben-tour-t617828/"],
  ["London", "United Kingdom", "tours", "Hyde Park and Kensington Gardens Walking Tour", "https://www.getyourguide.com/london-l57/london-hyde-park-and-kensington-gardens-walking-tour-t1034592/"],
  ["London", "United Kingdom", "tours", "Westminster Tour with River Cruise and Tower of London Entry", "https://www.klook.com/en-IN/activity/117135-westminster-tour-river-cruise-tower-of-london-entry/"],
  ["London", "United Kingdom", "activities", "Thames River Cruise with Optional London Eye Ticket", "https://www.getyourguide.com/en-au/london-l57/coca-cola-london-eye-river-cruise-t193403/"],
  ["London", "United Kingdom", "activities", "Thames Evening Cruise", "https://www.getyourguide.com/en-gb/london-l57/cruise-the-thames-with-a-glass-of-bubbly-canapes-t29923/"],
  ["London", "United Kingdom", "activities", "Paradox Museum Entry Ticket", "https://www.getyourguide.com/london-l57/london-paradox-museum-admission-ticket-t746331/"],
];

const categories: Record<Group, string[]> = {
  tours: ["city-tour", "audio-tour", "day-trip"],
  activities: ["attraction-ticket", "city-pass", "outdoor"],
};

const readApproved = unstable_cache(async (city: string, country: string) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
  const {data, error} = await db.from("tours")
    .select("title,source_url,affiliate_link,image_url,price_numeric,currency,tags")
    .ilike("city", city).ilike("country", country)
    .eq("is_public", true).eq("media_rights_verified", true)
    .overlaps("tags", [...categories.tours, ...categories.activities])
    .order("title").limit(36).abortSignal(AbortSignal.timeout(4000));
  if (error) throw new Error("Destination tour catalog unavailable");
  return data ?? [];
}, ["destination-reviewed-tours-v1"], {revalidate: 900});

function approvedImage(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.startsWith("/images/") && !value.includes("\\")) return value;
  const url = URL.parse(value);
  return url?.protocol === "https:" && !url.username && !url.password && !url.port ? url.href : null;
}

export async function destinationPartnerCatalog(city: string, country: string | null) {
  const result: Record<Group, Product[]> = {tours: [], activities: []};
  if (!country || !locationPattern.test(city) || !locationPattern.test(country)) return result;
  const rows = await readApproved(city, country).catch(() => []);
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row.title !== "string" || !row.title.trim() || !Array.isArray(row.tags)) continue;
    const link = destinationProductLink(row.source_url ?? "") ?? destinationProductLink(row.affiliate_link ?? "");
    if (!link || seen.has(link.id)) continue;
    const tags: string[] = row.tags;
    const group = categories.activities.some(category => tags.includes(category)) ? "activities"
      : categories.tours.some(category => tags.includes(category)) ? "tours" : null;
    if (!group) continue;
    seen.add(link.id);
    result[group].push({...link, title: row.title.trim(), image: approvedImage(row.image_url),
      detail: supplierPrice(row.price_numeric, row.currency) ?? "Check price and dates on the booking page"});
  }
  for (const [productCity, productCountry, group, title, url] of seed) {
    if (productCity.toLowerCase() !== city.toLowerCase() || productCountry.toLowerCase() !== country.toLowerCase()) continue;
    const link = destinationProductLink(url);
    if (!link || seen.has(link.id)) continue;
    seen.add(link.id);
    result[group].push({...link, title, image: null, detail: "Check price and dates on the booking page"});
  }
  return result;
}
