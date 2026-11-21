import "server-only";

import {approvedPexelsIllustrations} from "@/lib/travel/pexels-hotel-illustrations";

/**
 * Maldives hero editorial image only. Existing PEXELS_API_KEY stays on the
 * server. No browser API requests, user-supplied image queries, new config,
 * paid supplier API, or global CSS changes.
 *
 * Verified Pexels source: https://www.pexels.com/photo/
 * stunning-aerial-view-of-maldivian-overwater-bungalows-28843928/
 */
export const MALDIVES_PEXELS_FALLBACK =
  "https://images.pexels.com/photos/28843928/pexels-photo-28843928.jpeg?auto=compress&cs=tinysrgb&w=2000";

export async function maldivesPexelsHero():Promise<string> {
  const key=process.env.PEXELS_API_KEY;
  if (!key) return MALDIVES_PEXELS_FALLBACK;
  const params=new URLSearchParams({
    query:"Maldives aerial overwater bungalow lagoon",
    orientation:"landscape",per_page:"8",page:"1",
  });
  try {
    const response=await fetch("https://api.pexels.com/v1/search?"+params,{
      headers:{Authorization:key,Accept:"application/json"},
      next:{revalidate:60*60*24*30},
      signal:AbortSignal.timeout(2500),
    });
    if (!response.ok) return MALDIVES_PEXELS_FALLBACK;
    const payload:unknown=await response.json();
    // Existing shared allowlist checks both the Pexels source page
    // and the photo-CDN origin; only curated result descriptions pass.
    const photographs=approvedPexelsIllustrations(payload);
    const entries=payload&&typeof payload==="object"&&"photos" in payload&&
      Array.isArray(payload.photos)?payload.photos:[];
    const image=photographs.find(photo=>{
      const matched=entries.find(entry=>entry&&typeof entry==="object"&&
        "src" in entry&&typeof entry.src==="object"&&entry.src!==null&&
        "landscape" in entry.src&&entry.src.landscape===photo.src);
      if (!matched||typeof matched!=="object")return false;
      const alt="alt" in matched&&typeof matched.alt==="string"?matched.alt.toLowerCase():"";
      return /maldives|maldivian|overwater|lagoon|atoll|island/.test(alt);
    });
    return image?.src??MALDIVES_PEXELS_FALLBACK;
  }catch{
    return MALDIVES_PEXELS_FALLBACK;
  }
}
