import { createClient } from "@supabase/supabase-js";

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

export type TourFilters = {
  city?: string | null;
  minPrice?: string | null;
  maxPrice?: string | null;
  category?: string | null;
};

function validAmount(value: string | null | undefined): number | null {
  if (!value) return null;
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) return NaN;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000 ? amount : NaN;
}

function image(value: unknown): string {
  if (typeof value !== "string") return "/placeholder.jpg";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { return new URL(value).protocol === "https:" ? value : "/placeholder.jpg"; }
  catch { return "/placeholder.jpg"; }
}

export async function searchTours(filters: TourFilters): Promise<{ items: PublicTour[]; error: string | null; status: number }> {
  const city = filters.city?.trim().toLowerCase().replace(/\s+/g, "-") || "";
  const category = filters.category?.trim().toLowerCase() || "";
  const min = validAmount(filters.minPrice);
  const max = validAmount(filters.maxPrice);
  if ((city && !/^[a-z]+(?:-[a-z]+)*$/.test(city)) ||
      (category && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) ||
      city.length > 80 || category.length > 40 ||
      Number.isNaN(min) || Number.isNaN(max) ||
      (min !== null && max !== null && min > max)) {
    return { items: [], error: "Invalid tour filters", status: 400 };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { items: [], error: "Tour listings are not configured", status: 503 };

  try {
    const client = createClient(url, key);
    let query = client.from("tours")
      .select("id,title,city,city_slug,country,price_numeric,currency,rating,category,image_url")
      .order("title", { ascending: true })
      .limit(48);
    if (city) query = query.eq("city_slug", city);
    if (category) query = query.eq("category", category);
    if (min !== null) query = query.gte("price_numeric", min);
    if (max !== null) query = query.lte("price_numeric", max);

    const { data, error } = await query;
    if (error) return { items: [], error: "Tour listings are unavailable", status: 502 };

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
      rating: typeof tour.rating === "number" && tour.rating >= 1 && tour.rating <= 5 ? tour.rating : null,
      category: typeof tour.category === "string" ? tour.category : null,
    }));
    return { items, error: null, status: 200 };
  } catch {
    return { items: [], error: "Tour listings are unavailable", status: 502 };
  }
}

// Compatibility for any existing tour callers; no fabricated fallback.
export async function getTours(filters: TourFilters = {}): Promise<PublicTour[]> {
  return (await searchTours(filters)).items;
}
