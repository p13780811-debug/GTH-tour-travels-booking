import "server-only";
import { supabase } from "@/lib/supabase";
import { destinations as curated, destinationImageForSlug } from "@/data/destinations";
import { destinationGeography } from "@/lib/destinations/geography";

export type DirectoryDestination = {
  slug: string;
  title: string;
  image: string;
  description: string;
  location: string;
  country: string | null;
  region: string | null;
};

export type DirectoryQuery = {
  search: string;
  country: string;
  region: string;
  sort: "name" | "country";
  page: number;
  perPage: number;
};

function sourceDestination(item: {
  slug: string;
  name: string;
  country: string | null;
  description: string | null;
}): DirectoryDestination {
  const editorial = curated.find(place => place.slug === item.slug);
  return {
    slug: item.slug,
    title: item.name,
    image: editorial?.image_url || destinationImageForSlug(item.slug),
    description: editorial?.description ||
      item.description ||
      "Explore this destination and verify travel services with providers.",
    location: editorial ? "Editorial destination guide" : "Destination directory",
    ...destinationGeography(item.slug, item.country),
  };
}

function offlineDestinations(): DirectoryDestination[] {
  return curated.map(item => ({
    slug: item.slug,
    title: item.name,
    image: item.image_url,
    description: item.description,
    location: "Editorial destination guide",
    ...destinationGeography(item.slug),
  }));
}

export function editorialFeaturedDestinations(): DirectoryDestination[] {
  return offlineDestinations().filter(item =>
    ["dubai", "paris", "bali", "maldives"].includes(item.slug));
}

export async function destinationCountries(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .rpc("gth_destination_country_options")
      .abortSignal(AbortSignal.timeout(4_000));
    if (!error && Array.isArray(data)) {
      return [...new Set(data.flatMap(row =>
        typeof row.country === "string" ? [row.country] : []
      ))].sort((a, b) => a.localeCompare(b));
    }
  } catch {
    // Keep editorial fallback during a temporary database outage.
  }
  return [...new Set(offlineDestinations()
    .flatMap(item => item.country ? [item.country] : []))]
    .sort((a, b) => a.localeCompare(b));
}

export async function destinationDirectoryPage(
  input: DirectoryQuery,
  countries: readonly string[],
): Promise<{ rows: DirectoryDestination[]; total: number; page: number }> {
  const country = countries.includes(input.country) ? input.country : "";
  const allowedRegionCountries = input.region
    ? countries.filter(c => destinationGeography("", c).region === input.region)
    : [];
  const safeSearch = input.search
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .trim().slice(0, 70);
  const pageSize = input.perPage;
  const requested = Math.max(1, Math.min(9999, input.page));

  // A region with no country matches cannot silently return unrelated cities.
  if (input.region && !allowedRegionCountries.length) {
    return { rows: [], total: 0, page: 1 };
  }

  function request(page: number) {
    let query = supabase
      .from("destinations")
      .select("slug,name,description,country", { count: "exact" })
      .eq("is_active", true);

    if (country) query = query.eq("country", country);
    if (input.region) query = query.in("country", allowedRegionCountries);
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,country.ilike.%${safeSearch}%`
      );
    }
    query = query
      .order(input.sort === "country" ? "country" : "name", { ascending: true })
      .order("slug", { ascending: true });
    return query.range((page - 1) * pageSize, page * pageSize - 1)
      .abortSignal(AbortSignal.timeout(5_000));
  }

  try {
    let { data, error, count } = await request(requested);
    if (error || count === null || !Array.isArray(data)) throw Error("Directory unavailable");
    const total = count;
    const finalPage = Math.min(requested, Math.max(1, Math.ceil(total / pageSize)));
    if (finalPage !== requested && total) {
      const retry = await request(finalPage);
      if (retry.error || !retry.data) throw Error("Page retry failed");
      data = retry.data;
    }
    return {
      rows: data.flatMap(item =>
        typeof item.slug === "string" &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug) &&
        item.slug.length <= 140 &&
        typeof item.name === "string" && item.name.trim()
          ? [sourceDestination({
            slug: item.slug,
            name: item.name.trim().slice(0, 120),
            country: item.country,
            description: item.description,
          })]
          : []),
      total,
      page: finalPage,
    };
  } catch {
    const offline = offlineDestinations().filter(item => {
      if (country && item.country !== country) return false;
      if (input.region && item.region !== input.region) return false;
      if (!safeSearch) return true;
      const needle = safeSearch.toLocaleLowerCase("en");
      return [item.title, item.slug, item.description, item.country || ""]
        .some(text => text.toLocaleLowerCase("en").includes(needle));
    }).sort((a, b) =>
      input.sort === "country"
        ? (a.country || "").localeCompare(b.country || "") ||
          a.title.localeCompare(b.title)
        : a.title.localeCompare(b.title)
    );
    const total = offline.length;
    const finalPage = Math.min(requested, Math.max(1, Math.ceil(total / pageSize)));
    return {
      rows: offline.slice((finalPage - 1) * pageSize, finalPage * pageSize),
      total,
      page: finalPage,
    };
  }
}
