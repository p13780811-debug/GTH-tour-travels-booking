export const TOUR_PAGE_SIZE = 24;
export const TOUR_CATEGORIES = [
  { value: "city-tour", label: "Guided city tours" },
  { value: "attraction-ticket", label: "Attraction tickets" },
  { value: "audio-tour", label: "Audio tours" },
  { value: "city-pass", label: "City passes" },
  { value: "day-trip", label: "Day trips" },
  { value: "outdoor", label: "Outdoor experiences" },
] as const;
export const TOUR_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "JPY", "THB", "AUD", "CAD"] as const;
export type TourFilters = {
  city?: string | null; category?: string | null;
  minPrice?: string | null; maxPrice?: string | null;
  currency?: string | null; page?: string | null; sort?: string | null;
};
export type TourSearch = {
  city: string; category: string; minPrice: string; maxPrice: string;
  currency: string; page: number; sort: "name" | "price";
};
export type TourView = "rail" | "grid" | "list";
export const EMPTY_TOUR_SEARCH: TourSearch = {
  city: "", category: "", minPrice: "", maxPrice: "", currency: "", page: 1, sort: "name",
};
const keys = ["city", "category", "minPrice", "maxPrice", "currency", "page", "sort"] as const;

export function parseTourFilters(raw: Record<string, unknown>):
  { ok: true; filters: TourSearch } | { ok: false; error: string } {
  if (keys.some(key => raw[key] != null && typeof raw[key] !== "string")) {
    return { ok: false, error: "Choose one value for each tour filter." };
  }
  const value = (key: typeof keys[number]) => (typeof raw[key] === "string" ? raw[key] : "").trim();
  if (/[\u0000-\u001f\u007f]/.test(typeof raw.city === "string" ? raw.city : "")) {
    return { ok: false, error: "Enter a valid city name." };
  }
  const city = value("city").normalize("NFKC").replace(/\s+/g, " ");
  const category = value("category").toLowerCase();
  // Excludes PostgREST logical delimiters, quotes and LIKE wildcards.
  if (city && (!/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} .'-]*$/u.test(city) || city.length > 80)) {
    return { ok: false, error: "Enter a city name using letters, numbers, spaces, apostrophes or hyphens." };
  }
  if (category && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) || category.length > 40)) {
    return { ok: false, error: "Choose a valid experience category." };
  }
  const minPrice = value("minPrice"), maxPrice = value("maxPrice");
  const currency = value("currency").toUpperCase();
  for (const amount of [minPrice, maxPrice]) {
    if (amount && (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount) || Number(amount) > 100_000_000)) {
      return { ok: false, error: "Enter a listed price between 0 and 100,000,000." };
    }
  }
  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return { ok: false, error: "Maximum price must be at least the minimum price." };
  }
  if (currency && !/^[A-Z]{3}$/.test(currency)) return { ok: false, error: "Choose a three-letter currency." };
  if ((minPrice || maxPrice) && !currency) {
    return { ok: false, error: "Choose a currency before filtering listed prices." };
  }
  const page = value("page") || "1", rawSort = value("sort") || "name";
  if (!/^[1-9]\d{0,3}$/.test(page)) return { ok: false, error: "Choose a valid results page." };
  if (!["name", "price", "rating"].includes(rawSort)) return { ok: false, error: "Choose a valid sort order." };
  // Legacy rating links stay navigable; no reviewed source rating column exists.
  const sort = rawSort === "price" && currency ? "price" : "name";
  return { ok: true, filters: { city, category, minPrice, maxPrice, currency, page: Number(page), sort } };
}

export function tourDiscoveryHref(
  base: "/tours" | "/activities", filters: TourSearch, view: TourView = "rail",
  change: Partial<TourSearch> = {},
): string {
  const next = { ...filters, ...change }, params = new URLSearchParams();
  for (const key of ["city", "category", "minPrice", "maxPrice", "currency"] as const) {
    if (next[key]) params.set(key, next[key]);
  }
  if (next.sort !== "name") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  if (view !== "rail") params.set("view", view);
  return base + (params.size ? "?" + params.toString() : "") + "#discover";
}

/** Direct provider search, separate from the publisher's existing program links. */
export function directTourSearch(filters: TourSearch): string | null {
  const parsed = parseTourFilters({ ...filters, page: String(filters.page) });
  if (!parsed.ok || !parsed.filters.city) return null;
  const category = TOUR_CATEGORIES.find(item => item.value === filters.category)?.label || "";
  const url = new URL("https://www.klook.com/en-IN/search/result/");
  url.searchParams.set("query", [parsed.filters.city, category].filter(Boolean).join(" "));
  return url.href;
}

/** Page intent is fixed by the route, never by an arbitrary database expression. */
export const EXPERIENCE_MODES = {
 "/tours": {label:"Tours", title:"Discover Tours Around the World", description:"Explore guided city tours, audio walks and day trips.", action:"Find tours", categories:["city-tour","audio-tour","day-trip"]},
 "/activities": {label:"Activities", title:"Discover Activities & Attraction Tickets", description:"Find museums, city passes and outdoor experiences.", action:"Find activities", categories:["attraction-ticket","city-pass","outdoor"]},
} as const;
export type ExperiencePath = keyof typeof EXPERIENCE_MODES;
export function experienceCategories(basePath:ExperiencePath){
 const ids:readonly string[]=EXPERIENCE_MODES[basePath].categories;
 return TOUR_CATEGORIES.filter(item=>ids.includes(item.value));
}
