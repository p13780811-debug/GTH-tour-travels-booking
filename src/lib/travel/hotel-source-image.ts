/**
 * One conservative display URL policy for hotel cards and hotel detail pages.
 * Source-ID/rights checks belong to the catalog and approved-media queries;
 * a valid image URL alone is NOT proof that a photo depicts a given property.
 */
export function hotelSourceImageUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 1600) return null;

  // Only known static image assets under the existing /images directory.
  if (/^\/images\/[A-Za-z0-9/_-]+\.(?:jpe?g|png|webp|avif)$/i.test(value)) return value;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || host === "localhost" || host.endsWith(".localhost") ||
        host.endsWith(".local") || host.endsWith(".internal") ||
        /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.startsWith("[")) return null;
    if (!/\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
