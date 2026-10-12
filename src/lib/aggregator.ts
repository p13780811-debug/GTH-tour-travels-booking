import { createClient } from "@supabase/supabase-js";

/**
 * Legacy hotel discovery adapter. Never treat images or generated content as inventory,
 * and never construct an API URL from a token.
 */
export async function fetchGTHData(city: string) {
  const location = typeof city === "string" ? city.trim() : "";
  if (!/^[\p{L}\p{M}\s.'-]{2,80}$/u.test(location)) return [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase
      .from("hotels")
      .select("id,name,city,stars,image_url")
      .ilike("city", `%${location}%`)
      .limit(24);

    if (error) return [];
    return (data || []).filter((item) => typeof item.name === "string" && typeof item.city === "string")
      .map((item) => ({
        id: item.id,
        name: item.name,
        city: item.city,
        stars: item.stars,
        image: typeof item.image_url === "string" ? item.image_url : "/placeholder.jpg",
      }));
  } catch {
    return [];
  }
}
