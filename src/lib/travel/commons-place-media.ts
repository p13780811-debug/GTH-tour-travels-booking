/**
 * Read-only, bounded, identity-linked Commons photo lookup for community-mapped
 * attractions. These are photographs of source-linked PLACES, not operator
 * product photos, live tickets, reservations or product availability.
 *
 * A Wikidata P18 claim ties the candidate filename to the precise QID.
 * MediaWiki imageinfo ties the file to explicit author/license/source evidence.
 * Missing or unverified metadata produces no photograph, never a random stock one.
 * Editorial approval for independently bookable tour records remains separate.
 */
export type LicensedPlacePhoto = {
  url: string;
  page: string;
  author: string;
  license: string;
  licenseUrl: string;
  width: number;
  height: number;
};

const LICENSES: Record<string, string> = {
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
  "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
};
const QID = /^Q[1-9][0-9]{0,14}$/;
type ObjectMap = Record<string, unknown>;
function object(value: unknown): ObjectMap | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as ObjectMap : null;
}
function httpsAt(value: unknown, host: string, prefix: string): string | null {
  if (typeof value !== "string" || value.length > 1700) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== host || !url.pathname.startsWith(prefix) ||
        url.username || url.password || url.port || url.hash) return null;
    return url.toString();
  } catch { return null; }
}
function plain(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim().slice(0, 200);
}
function metaValue(info: ObjectMap, key: string): string {
  const ext = object(info.extmetadata);
  return plain(object(ext?.[key])?.value);
}
/** Pure validator; rejects unknown licences, restricted files and mismatched hosts. */
export function safeLicensedPlacePhoto(value: unknown): LicensedPlacePhoto | null {
  const image = object(value);
  if (!image) return null;
  const url = httpsAt(image.thumburl || image.url, "upload.wikimedia.org", "/wikipedia/commons/");
  const page = httpsAt(image.descriptionurl, "commons.wikimedia.org", "/wiki/File:");
  const license = metaValue(image, "LicenseShortName");
  const licenseUrl = httpsAt(metaValue(image, "LicenseUrl"), "creativecommons.org", "/");
  const author = metaValue(image, "Attribution") || metaValue(image, "Artist");
  const width = image.width, height = image.height;
  if (!url || !page || !LICENSES[license] || !licenseUrl ||
      new URL(licenseUrl).href !== LICENSES[license] ||
      !author || author.length < 3 ||
      typeof width !== "number" || width < 800 ||
      typeof height !== "number" || height < 500 ||
      metaValue(image, "NonFree").toLowerCase() === "true" ||
      metaValue(image, "Restrictions")) return null;
  return {url, page, author, license, licenseUrl, width, height};
}

async function jsonFrom(url: URL): Promise<ObjectMap | null> {
  try {
    const response = await fetch(url.toString(), {
      headers: {"Accept": "application/json"},
      next: {revalidate: 604800},
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) return null;
    return object(await response.json());
  } catch { return null; }
}

/** At most 16 exact identity lookups per render; two cached public API calls. */
export async function licensedCommonsPhotos(qids: readonly string[]): Promise<Map<string, LicensedPlacePhoto>> {
  const result = new Map<string, LicensedPlacePhoto>();
  const ids = [...new Set(qids.filter(q => QID.test(q)))].slice(0, 16);
  if (!ids.length) return result;
  const wikidata = new URL("https://www.wikidata.org/w/api.php");
  for (const [key,value] of Object.entries({
    action:"wbgetentities", ids:ids.join("|"), props:"claims", format:"json",
  })) wikidata.searchParams.set(key,value);
  const doc = await jsonFrom(wikidata);
  const entities = object(doc?.entities);
  if (!entities) return result;
  const fileById = new Map<string,string>();
  for (const qid of ids) {
    const claims = object(object(entities[qid])?.claims);
    const p18 = claims?.P18;
    if (!Array.isArray(p18)) continue;
    const snak = object(object(p18[0])?.mainsnak);
    const name = object(snak?.datavalue)?.value;
    if (typeof name === "string" && name.length <= 220 &&
        /\.(?:jpe?g|png|webp)$/i.test(name) && !/[\x00-\x1f|?#<>]/.test(name))
      fileById.set(qid,name.replace(/_/g," "));
  }
  if (!fileById.size) return result;
  const commons = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [key,value] of Object.entries({
    action:"query", format:"json", formatversion:"2", prop:"imageinfo",
    titles:[...new Set(fileById.values())].map(s => "File:"+s).join("|"),
    iiprop:"url|size|extmetadata", iiurlwidth:"960",
    iiextmetadatafilter:"LicenseShortName|LicenseUrl|Artist|Attribution|NonFree|Restrictions",
  })) commons.searchParams.set(key,value);
  const response = await jsonFrom(commons);
  const pages = object(response?.query)?.pages;
  if (!Array.isArray(pages)) return result;
  const byName = new Map<string, LicensedPlacePhoto>();
  for (const raw of pages) {
    const item = object(raw);
    const info = Array.isArray(item?.imageinfo) ? item.imageinfo[0] : null;
    const photo = safeLicensedPlacePhoto(info);
    if (typeof item?.title === "string" && photo) {
      const key = item.title.replace(/_/g," ").toLowerCase();
      byName.set(key,photo);
    }
  }
  for (const [qid,file] of fileById) {
    const photo = byName.get(("File:"+file).toLowerCase());
    if (photo) result.set(qid,photo);
  }
  return result;
}
