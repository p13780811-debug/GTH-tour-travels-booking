import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cleanString } from "@/lib/security/validators";
import { hotelPageWindow } from "@/lib/travel/hotel-page-window";

const PAGE_SIZE = 24;
const PARTNER_HOSTS = ["klook.com", "trip.com", "booking.com", "hotellook.com", "tp.media", "tpo.lv"];
const safeHeaders = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function safePartnerLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    return PARTNER_HOSTS.some((domain) => host === domain || host.endsWith("." + domain)) ? url.toString() : null;
  } catch {
    return null;
  }
}
function safeImage(value: unknown): string {
  if (typeof value !== "string") return "/placeholder.jpg";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return new URL(value).protocol === "https:" ? value : "/placeholder.jpg";
  } catch {
    return "/placeholder.jpg";
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawCity = searchParams.get("city");
  const destination = searchParams.get("destination");
  if (destination && !/^[a-z]+(?:-[a-z]+)*$/.test(destination)) return NextResponse.json({error:"Invalid destination"},{status:400,headers:safeHeaders});
  const rawName = searchParams.get("name");
  const rawCountry = searchParams.get("country");
  const detected = req.headers.get("x-vercel-ip-country") ?? "";
  const country = rawCountry ? rawCountry.trim().toUpperCase() : (!rawCity && !rawName && /^[A-Z]{2}$/.test(detected) ? detected : "");
  const category = searchParams.get("category") ?? "";
  const source = searchParams.get("source") ?? "all";
  const sort = searchParams.get("sort") ?? "name_asc";
  if (!["all","partner","directory"].includes(source) || !["name_asc","name_desc"].includes(sort))
    return NextResponse.json({error:"Invalid source or sort"},{status:400,headers:safeHeaders});
  if ((rawCountry && !/^[A-Z]{2}$/.test(rawCountry.toUpperCase())) ||
      (category && !["hotel","motel","hostel","guest_house","apartment","resort"].includes(category)))
    return NextResponse.json({error:"Invalid country or accommodation type"},{status:400,headers:safeHeaders});
  const city = rawCity ? cleanString(rawCity, {
    min: 2, max: 80, pattern: /^[\p{L}\p{M}\s.'-]+$/u,
  }) : null;
  const name = rawName ? cleanString(rawName, {
    min: 2, max: 80, pattern: /^[\p{L}\p{M}\p{N}\s.'&-]+$/u,
  }) : null;
  if ((rawCity && !city) || (rawName && !name))
    return NextResponse.json({ error: "Enter a valid hotel name or destination" }, { status: 400, headers: safeHeaders });
  const rawPage = searchParams.get("page") ?? "1";
  if (!/^[1-9][0-9]{0,2}$/.test(rawPage) || Number(rawPage) > 100) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400, headers: safeHeaders });
  }
  const page = Number(rawPage);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 503, headers: safeHeaders });
  }
  try {
    const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    // Destination links resolve to the actual destination record; user-provided
    // strings cannot create public hotel data or change geography.
    let matchingCity = city;
    if (destination) {
      const {data:place,error:placeError}=await supabase.from("destinations")
        .select("name").eq("slug",destination).eq("is_active",true).maybeSingle();
      if(placeError)return NextResponse.json({error:"Destination lookup unavailable"},{status:503,headers:safeHeaders});
      const knownName=place?.name;
      if(typeof knownName!=="string"||!cleanString(knownName,{min:2,max:80,pattern:/^[\p{L}\p{M}\s.'-]+$/u}))
        return NextResponse.json({error:"Destination not found"},{status:404,headers:safeHeaders});
      matchingCity=knownName.trim();
    }
    // Name queries search globally (with optional city) instead of pretending
    // that a hotel brand is a city. Escaped percent/underscore are literals.
    const safeLike = (value: string) => "%" + value.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
    const cityLike = matchingCity ? safeLike(matchingCity) : "";
    const nameLike = name ? safeLike(name) : "";
    const ascending = sort !== "name_desc";
    let supplierCountQuery = supabase.from("hotels").select("id", { count: "exact", head: true }).eq("is_public", true).eq("media_rights_verified", true).not("source_name","is",null);
    let catalogCountQuery = supabase.from("hotel_catalog").select("source_id", { count: "exact", head: true });
    if (matchingCity) {
      supplierCountQuery = supplierCountQuery.ilike("city",cityLike);
      catalogCountQuery = catalogCountQuery.or("city.ilike."+cityLike+",region.ilike."+cityLike+",address.ilike."+cityLike+",name.ilike."+cityLike);
    }
    if (name) { supplierCountQuery = supplierCountQuery.ilike("name", nameLike); catalogCountQuery = catalogCountQuery.ilike("name", nameLike); }
    if (source === "partner") catalogCountQuery = catalogCountQuery.eq("source","__excluded__");
    if (source === "directory") supplierCountQuery = supplierCountQuery.eq("city","__excluded__");
    if (country) catalogCountQuery = catalogCountQuery.or("country_code.eq."+country+",extract_country_hint.eq."+country);
    if (category) catalogCountQuery = catalogCountQuery.eq("category",category);
    if (country) supplierCountQuery = supplierCountQuery.eq("country_code",country);
    if (category) supplierCountQuery = category === "hotel"
      ? supplierCountQuery.or("category.eq.hotel,category.is.null")
      : supplierCountQuery.eq("category",category);
    const [supplierCountResult, catalogCountResult] = await Promise.all([supplierCountQuery, catalogCountQuery]);
    const supplierCount = supplierCountResult.error ? 0 : (supplierCountResult.count ?? 0);
    const catalogCount = catalogCountResult.error ? 0 : (catalogCountResult.count ?? 0);
    if (supplierCountResult.error && catalogCountResult.error) {
      return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
    }
    const firstWindow = hotelPageWindow(page, supplierCount, catalogCount, PAGE_SIZE);
    let supplierFailed = Boolean(supplierCountResult.error);
    let supplierRows: Array<{ id: string | number; name: string; city: string; image_url: string | null; affiliate_link: string | null; category:string|null; country_code:string|null; source_name:string|null }> = [];
    if (firstWindow.supplierTake > 0) {
      let supplierQuery = supabase.from("hotels")
        .select("id,name,city,image_url,affiliate_link,is_public,category,country_code,source_name")
        .eq("is_public", true).eq("media_rights_verified",true).not("source_name","is",null);
      if (source === "directory") supplierQuery = supplierQuery.eq("city","__excluded__");
      if (matchingCity) supplierQuery = supplierQuery.ilike("city", cityLike);
      if (name) supplierQuery = supplierQuery.ilike("name", nameLike);
      if (country) supplierQuery=supplierQuery.eq("country_code",country);
      if (category) supplierQuery = category === "hotel"
        ? supplierQuery.or("category.eq.hotel,category.is.null")
        : supplierQuery.eq("category",category);
      const { data, error } = await supplierQuery.order("name",{ascending}).order("id",{ascending})
        .range(firstWindow.supplierStart, firstWindow.supplierStart + firstWindow.supplierTake - 1);
      if (error) supplierFailed = true;
      else supplierRows = data ?? [];
    }
    // A failed supplier read must never shift the catalog offset beyond records
    // that have not yet been displayed: start again with catalog-only paging.
    const supplierVisible = supplierFailed ? 0 : supplierCount;
    const window = hotelPageWindow(page, supplierVisible, catalogCount, PAGE_SIZE);
    if (supplierFailed) supplierRows = [];
    let catalogFailed = Boolean(catalogCountResult.error);
    let catalogRows: Array<{ source_id: string; name: string; city: string | null; region:string|null; category: string; image_url: string | null; country_code:string|null;extract_country_hint:string|null;source_url:string;website:string|null;address:string|null;latitude:number;longitude:number;updated_at:string }> = [];
    if (window.catalogTake > 0 && !catalogFailed && window.catalogStart < catalogCount) {
      let catalogQuery = supabase.from("hotel_catalog").select("source_id,name,city,region,category,image_url,country_code,extract_country_hint,source_url,website,address,latitude,longitude,updated_at");
      if (source === "partner") catalogQuery = catalogQuery.eq("source","__excluded__");
      if (matchingCity) catalogQuery = catalogQuery.or("city.ilike."+cityLike+",region.ilike."+cityLike+",address.ilike."+cityLike+",name.ilike."+cityLike);
      if (name) catalogQuery = catalogQuery.ilike("name", nameLike);
      if (country) catalogQuery = catalogQuery.or("country_code.eq."+country+",extract_country_hint.eq."+country);
      if (category) catalogQuery = catalogQuery.eq("category",category);
      const { data, error } = await catalogQuery.order("name",{ascending}).order("source_id",{ascending})
        .range(window.catalogStart, window.catalogStart + window.catalogTake - 1);
      if (error) catalogFailed = true;
      else catalogRows = data ?? [];
    }
    if (supplierFailed && catalogFailed) {
      return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
    }
    // Licensed Wikimedia overlays are independent of OSM upsert refreshes.
    // Lookup at most one page of exact OSM source IDs; failures never hide hotels.
    type LicensedMedia={source_id:string;image_url:string;author:string;license_name:string;license_url:string;commons_page:string};
    const commons=new Map<string,LicensedMedia>();
    const candidates=catalogRows.filter(item=>!item.image_url).map(item=>item.source_id);
    if(candidates.length){
      const {data:media}=await supabase.from("hotel_catalog_media")
        .select("source_id,image_url,author,license_name,license_url,commons_page")
        .eq("source","osm").in("source_id",candidates.slice(0,24));
      for(const item of (media||[]) as LicensedMedia[])commons.set(item.source_id,item);
    }
    const listings = supplierRows
      .filter((hotel) => typeof hotel.name === "string" && hotel.name.trim() && typeof hotel.city === "string")
      .map((hotel) => ({
        id: hotel.id, name: hotel.name, city: hotel.city, stars: null,
        image: safeImage(hotel.image_url), affiliate_link: safePartnerLink(hotel.affiliate_link),
        category:hotel.category||"hotel",country:hotel.country_code,
        source:hotel.source_name==="GTH PRO Reviewed Hotel Partner"?"Reviewed hotel owner":"Verified partner listing",
      }));
    const osm = catalogRows.filter((hotel) => typeof hotel.name === "string" && hotel.name.trim())
      .map((hotel) => ({
        id: "osm:" + hotel.source_id.replace("/", "-"), name: hotel.name, city: hotel.city || hotel.region || "City not specified", region:hotel.region,
        country: hotel.country_code, location_scope:hotel.country_code?"OSM country tag":"Geofabrik extract hint (not verified country)", category:hotel.category, stars: null, image: safeImage(hotel.image_url||commons.get(hotel.source_id)?.image_url), affiliate_link: null,
        image_attribution:!hotel.image_url&&commons.has(hotel.source_id)?{
          author:commons.get(hotel.source_id)!.author,license:commons.get(hotel.source_id)!.license_name,
          license_url:commons.get(hotel.source_id)!.license_url,commons_page:commons.get(hotel.source_id)!.commons_page
        }:null,
        source_url:hotel.source_url, hotel_website:hotel.website, address:hotel.address,
        latitude:hotel.latitude, longitude:hotel.longitude, updated_at:hotel.updated_at,
        source: "OpenStreetMap", source_license: "ODbL-1.0",
      }));
    // Name equality is not proof of duplicate physical properties; do not
    // discard unrelated hotels solely because they share a public name.
    const results = [...listings, ...osm];
    const visibleTotal = (supplierFailed ? 0 : supplierCount) + (catalogFailed ? 0 : catalogCount);
    return NextResponse.json(results, { headers: {
      ...safeHeaders, "X-GTH-Country":country, "X-GTH-Total":String(visibleTotal), "X-GTH-Page": String(page), "X-GTH-Page-Size": String(PAGE_SIZE),
      "X-GTH-Has-More": String(results.length > 0 && page * PAGE_SIZE < visibleTotal),
    } });
  } catch {
    return NextResponse.json({ error: "Hotel listings are temporarily unavailable" }, { status: 502, headers: safeHeaders });
  }
}
