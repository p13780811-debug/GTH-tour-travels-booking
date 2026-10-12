/**
 * Hotel name/location lookup from Travelpayouts/Hotellook.
 * This is discovery metadata, not a live price or availability feed.
 * Credentials remain server-side.
 */
export async function getHotels(cityCode: string): Promise<unknown> {
  const query = typeof cityCode === "string" ? cityCode.trim() : "";
  if (!/^[\\p{L}\\p{M}\\s.'-]{2,80}$/u.test(query)) {
    throw new Error("Invalid hotel lookup destination");
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN || process.env.TRAVELPAYOUTS_API_TOKEN;
  if (!token) {
    throw new Error("Hotel provider is not configured");
  }

  const url = new URL("https://api.travelpayouts.com/hotellook/v1/lookup");
  url.searchParams.set("query", query);
  url.searchParams.set("lang", "en");
  url.searchParams.set("lookFor", "both");
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    headers: { "X-Access-Token": token },
    signal: AbortSignal.timeout(8_000),
    next: { revalidate: 3_600 },
  });

  if (!response.ok) {
    throw new Error("Hotel lookup provider unavailable");
  }

  return (await response.json()) as unknown;
}
