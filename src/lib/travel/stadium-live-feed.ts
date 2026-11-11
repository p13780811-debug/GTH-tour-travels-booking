import "server-only";
import {unstable_cache} from "next/cache";
import {stadiums, upcomingStadiumEvents} from "@/lib/travel/stadiums";
import {
  normalizeOfficialStadiumEvent, normalizeTicketmasterSportsEvent,
  SPORTS_SEGMENT_ID, type StadiumFeedEvent,
} from "@/lib/travel/stadium-event-normalize";

const SIX_HOURS = 6 * 60 * 60;
const MAX_EVENTS_PER_MARKET = 18;
/**
 * Explicitly bounded supplier markets, NOT worldwide completeness.
 * Supplier may not cover all sports, leagues, or regions (including India).
 * 8 queries per 6 hours -> ~32 provider requests/day at normal cache operation.
 */
const SUPPLIER_COUNTRIES = ["US","GB","CA","AU","FR","DE","ES","NZ"] as const;

type TicketmasterResponse = {
  _embedded?: {events?:unknown[]};
};
export type StadiumFeedResponse = {
  events: StadiumFeedEvent[];
  sourceConnected: boolean;
  supplierMarkets: readonly string[];
  refreshIntervalHours: number;
  scope: "selected-events";
};

function providerApproved(): boolean {
  return process.env.GTH_TICKETMASTER_COMMERCIAL_USE_APPROVED === "true" &&
    typeof process.env.TICKETMASTER_DISCOVERY_API_KEY === "string" &&
    process.env.TICKETMASTER_DISCOVERY_API_KEY.trim().length > 8;
}

async function fetchTicketmasterCountry(country: string, now: Date): Promise<StadiumFeedEvent[]> {
  // No arbitrary client-controlled URL, country or API key is ever sent to a browser.
  const apiKey = process.env.TICKETMASTER_DISCOVERY_API_KEY;
  if (!providerApproved() || !apiKey || !SUPPLIER_COUNTRIES.some(item=>item===country)) return [];
  const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("countryCode", country);
  url.searchParams.set("segmentId", SPORTS_SEGMENT_ID);
  url.searchParams.set("startDateTime", now.toISOString().slice(0, 19)+"Z");
  url.searchParams.set("endDateTime", new Date(now.getTime()+365*86400_000).toISOString().slice(0,19)+"Z");
  url.searchParams.set("size", String(MAX_EVENTS_PER_MARKET));
  url.searchParams.set("page", "0");
  url.searchParams.set("sort", "date,asc");
  url.searchParams.set("includeTBA", "no");
  url.searchParams.set("includeTBD", "no");
  try {
    const response = await fetch(url, {
      method:"GET",
      signal:AbortSignal.timeout(4500),
      headers:{"Accept":"application/json"},
      next:{revalidate:SIX_HOURS},
    });
    if (!response.ok) return [];
    // Defensive upper bound on supplier response size.
    if (Number(response.headers.get("content-length")||0) > 512_000) return [];
    const data:TicketmasterResponse = await response.json();
    const raw=Array.isArray(data?._embedded?.events) ? data._embedded.events.slice(0,MAX_EVENTS_PER_MARKET) : [];
    return raw.map(value=>normalizeTicketmasterSportsEvent(value,now.getTime()))
      .filter((event):event is StadiumFeedEvent=>Boolean(event) && event.countryCode === country);
  } catch {
    // Fail closed; do not leak vendor errors or API keys to page HTML or logs.
    return [];
  }
}

const cachedSupplierMatches = unstable_cache(async () => {
  if(!providerApproved()) return [] as StadiumFeedEvent[];
  const now = new Date();
  const items:StadiumFeedEvent[] = [];
  // Two-country batches stay comfortably below the public API burst limit.
  for(let offset=0;offset<SUPPLIER_COUNTRIES.length;offset+=2){
    const chunk=SUPPLIER_COUNTRIES.slice(offset,offset+2);
    const results=await Promise.all(chunk.map(c=>fetchTicketmasterCountry(c,now)));
    for(const batch of results) items.push(...batch);
  }
  return items;
},["gth-stadium-supplier-events-v1"],{revalidate:SIX_HOURS});

function officialStadiumEvents(now:Date):StadiumFeedEvent[] {
  const today=now.toISOString().slice(0,10);
  const items:StadiumFeedEvent[]=[];
  for(const stadium of stadiums){
    for(const event of upcomingStadiumEvents(stadium,now)){
      const safe=normalizeOfficialStadiumEvent({
        slug:stadium.slug,
        title:event.label,
        sport:stadium.sports[0]??"Sports",
        venue:stadium.name,
        city:stadium.city,
        country:stadium.country,
        countryCode:stadium.countryCode,
        day:event.starts,
        url:event.url,
      },today);
      if(safe)items.push(safe);
    }
  }
  return items;
}

/**
 * Auto-renews official selected events via page ISR; supplier discovery only
 * after documented commercial permission + free developer key are configured.
 * Never promises every match, seat inventory, prices or affiliate commissions.
 */
export async function getStadiumUpcomingFeed(now=new Date()):Promise<StadiumFeedResponse> {
  const official=officialStadiumEvents(now);
  const active=providerApproved();
  const external=active?await cachedSupplierMatches():[];
  const deduped=new Map<string,StadiumFeedEvent>();
  for(const event of [...official,...external]){
    if(event.day < now.toISOString().slice(0,10))continue;
    deduped.set(event.id,event);
  }
  return {
    events:[...deduped.values()].sort((a,b)=>a.day.localeCompare(b.day)||a.title.localeCompare(b.title)),
    sourceConnected:active,
    supplierMarkets:active ? SUPPLIER_COUNTRIES : [],
    refreshIntervalHours:6,
    scope:"selected-events",
  };
}
