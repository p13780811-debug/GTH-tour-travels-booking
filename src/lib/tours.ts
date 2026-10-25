import { createClient } from "@supabase/supabase-js";
import { parseTourFilters, TOUR_PAGE_SIZE, EXPERIENCE_MODES, type ExperiencePath, type TourFilters } from "@/lib/tours/discovery";
export type { TourFilters } from "@/lib/tours/discovery";

export type PublicTour = {
  id: string | number;
  title: string;
  city: string;
  city_slug: string;
  country: string | null;
  image_url: string;
  price_numeric: number | null;
  currency: string | null;
  rating: number | null;
  category: string | null;
};


function image(value: unknown): string {
  if (typeof value !== "string") return "/placeholder.jpg";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : "/placeholder.jpg";
  } catch { return "/placeholder.jpg"; }
}
export type TourSearchResult = {
  items: PublicTour[]; error: string | null; status: number;
  total: number; catalogTotal: number; page: number; pageSize: number;
};
export async function searchTours(filters: TourFilters, mode?: ExperiencePath): Promise<TourSearchResult> {
  const parsed = parseTourFilters(filters);
  const empty = { items: [] as PublicTour[], total: 0, catalogTotal: 0,
    page: parsed.ok ? parsed.filters.page : 1, pageSize: TOUR_PAGE_SIZE };
  if (!parsed.ok) return { ...empty, error: "Invalid tour filters. " + parsed.error, status: 400 };
  const f = parsed.filters;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ...empty, error: "Tour listings are not configured", status: 503 };
  try {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const base = (head = false) => {
      const query = client.from("tours")
        .select("id,title,city,city_slug,country,price_numeric,currency,tags,image_url", { count: "exact", head })
        .eq("is_public", true).eq("media_rights_verified", true);
      // Old explicit-category links remain valid; unfiltered pages have distinct intent.
      return mode && !f.category ? query.overlaps("tags", [...EXPERIENCE_MODES[mode].categories]) : query;
    };
    const matching = (head = false) => {
      let query = base(head);
      if (f.city) {
        const city = f.city.replaceAll("-", " ");
        const slug = f.city.toLowerCase().replace(/\s+/g, "-");
        query = query.or("city.ilike.%" + city + "%,city_slug.eq." + slug);
      }
      if (f.category) query = query.contains("tags", [f.category]);
      if (f.currency) query = query.eq("currency", f.currency);
      if (f.minPrice) query = query.gte("price_numeric", Number(f.minPrice));
      if (f.maxPrice) query = query.lte("price_numeric", Number(f.maxPrice));
      return query;
    };
    const [catalog, counted] = await Promise.all([base(true), matching(true)]);
    if (catalog.error || counted.error) return { ...empty, error: "Tour listings are unavailable", status: 502 };
    const catalogTotal = catalog.count ?? 0, total = counted.count ?? 0;
    const offset = (f.page - 1) * TOUR_PAGE_SIZE;
    if (offset >= total) return { ...empty, catalogTotal, total, error: null, status: 200 };
    let query = matching();
    if (f.sort === "price") query = query.order("price_numeric", { ascending: true, nullsFirst: false });
    const { data, error } = await query.order("title", { ascending: true })
      .order("id", { ascending: true }).range(offset, Math.min(total - 1, offset + TOUR_PAGE_SIZE - 1));
    if (error) return { ...empty, catalogTotal, total, error: "Tour listings are unavailable", status: 502 };
    const items = (data || []).filter((tour) =>
      (typeof tour.id === "string" || typeof tour.id === "number") &&
      typeof tour.title === "string" && tour.title.trim() &&
      typeof tour.city_slug === "string" && /^[a-z0-9-]{2,80}$/.test(tour.city_slug)
    ).map((tour) => ({
      id: tour.id,
      title: tour.title.trim(),
      city: typeof tour.city === "string" ? tour.city : "",
      city_slug: tour.city_slug,
      country: typeof tour.country === "string" ? tour.country : null,
      image_url: image(tour.image_url),
      price_numeric: typeof tour.price_numeric === "number" && tour.price_numeric > 0 ? tour.price_numeric : null,
      currency: typeof tour.currency === "string" && /^[A-Z]{3}$/.test(tour.currency) ? tour.currency : null,
      rating: null, // No verified rating column exists in the public source.
      category: Array.isArray(tour.tags) && typeof tour.tags[0] === "string" ? tour.tags[0].slice(0, 40) : null,
    }));

    return { ...empty, items, catalogTotal, total, error: null, status: 200 };
  } catch { return { ...empty, error: "Tour listings are unavailable", status: 502 }; }
}
// Existing callers continue to receive reviewed public records only.
export async function getTours(filters: TourFilters = {}): Promise<PublicTour[]> {
  return (await searchTours(filters)).items;
}
