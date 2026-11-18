/** Public discovery ONLY; never treated as a verified seller or an affiliate link. */
const token = (value: unknown, limit: number): string | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (cleaned.length < 2 || cleaned.length > limit ||
      !/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.'&()/-]*$/u.test(cleaned)) return null;
  return cleaned;
};
export function officialTicketSearchUrl(
  home: unknown, away: unknown, stadium: unknown, sport: unknown, date?: unknown
): string | null {
  const a = token(home, 110), b = token(away, 110);
  const venue = token(stadium, 150), category = token(sport, 80);
  if (!a || !b || !venue || !category || a.toLocaleLowerCase("en") === b.toLocaleLowerCase("en")) return null;
  const day = typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : "";
  const query = [a, "vs", b, category, venue, day, "official", "tickets"].filter(Boolean).join(" ");
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);
  return url.toString();
}
