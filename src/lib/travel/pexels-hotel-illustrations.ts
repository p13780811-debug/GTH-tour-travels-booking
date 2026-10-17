/**
 * Pexels images are decorative travel illustrations, never verified property
 * photography. Keep API media/credit metadata out of the hotel database.
 */
export type HotelIllustration = Readonly<{
  src: string;
  photoUrl: string;
  photographer: string;
}>;

function allowedUrl(value: unknown, host: string, prefix: string): string | null {
  if (typeof value !== "string" || value.length > 1200) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== host || !url.pathname.startsWith(prefix) ||
        url.username || url.password || url.port || url.hash) return null;
    return url.toString();
  } catch { return null; }
}

export function approvedPexelsIllustrations(payload: unknown): HotelIllustration[] {
  if (!payload || typeof payload !== "object" || !("photos" in payload) ||
      !Array.isArray(payload.photos)) return [];
  const found: HotelIllustration[] = [];
  const seen = new Set<string>();
  for (const raw of payload.photos.slice(0, 8)) {
    if (!raw || typeof raw !== "object" || !("src" in raw) || !("url" in raw) ||
        !("photographer" in raw)) continue;
    const photo = raw as {src?:{landscape?:unknown;large?:unknown};url?:unknown;photographer?:unknown};
    const src = allowedUrl(photo.src?.landscape || photo.src?.large, "images.pexels.com", "/photos/");
    const photoUrl = allowedUrl(photo.url, "www.pexels.com", "/photo/");
    const photographer = typeof photo.photographer === "string"
      ? photo.photographer.trim().slice(0, 90) : "";
    if (!src || !photoUrl || !photographer || seen.has(src)) continue;
    seen.add(src);
    found.push({src, photoUrl, photographer});
    if (found.length === 4) break;
  }
  return found;
}
