import { headers } from "next/headers";
import Link from "next/link";
import { Globe2, MapPin, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { resolveVercelGeoCity, SUPPORTED_UI_LOCALES, type UiLocale } from "@/lib/router/edgeGeoAutoDetect";
import CitySpineHub from "./CitySpineHub";

/** Header resolution is always request-scoped and never persisted or trusted for auth. */
export default async function GeoCityIntro({language}: {language?: string}) {
  if (process.env.ENABLE_UNIFIED_CITY_ROUTER !== "true") return null;
  const requestHeaders = await headers();
  const geoHeaders = new Headers();
  for (const field of ["x-vercel-ip-country", "x-vercel-ip-city", "accept-language"]) {
    const value = requestHeaders.get(field);
    if (value) geoHeaders.set(field, value);
  }
  const geo = await resolveVercelGeoCity(supabase, geoHeaders);
  const override = typeof language === "string" &&
    SUPPORTED_UI_LOCALES.some(code => code === language)
      ? language as UiLocale : null;
  const locale = override ?? geo.locale;

  // An exact city+country+UUID match is required. A country hint must NEVER
  // auto-redirect to some unrelated city. This is preference, not IP proof.
  if (geo.city) {
    return <div aria-label="Detected city showcase" className="scroll-mt-20">
      <CitySpineHub city={geo.city} locale={locale} currency={geo.currency} detected/>
      <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6">
        <Link href={"/destinations/"+encodeURIComponent(geo.city.slug)}
          className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm">
          <MapPin size={16}/> Open full {geo.city.name} destination guide
        </Link>
      </div>
    </div>;
  }

  return <section aria-label="City and language preferences"
    className="border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-6 text-[var(--text)] sm:px-6">
    <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--gold)]">
        <Globe2 size={15}/> Find your four-pillar city hub
      </p>
      <p className="mt-2 text-sm text-[var(--text-soft)]">
        {geo.countryCode
          ? "Your region was detected, but an exact city match could not be verified. Select a city manually."
          : "Choose a city to explore travel, stadiums, property research and country-level tenders."}
      </p>
      <form method="get" action="/destinations#discover" role="search"
        className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[180px] flex-1 text-xs text-[var(--text-soft)]">
          City or country
          <input name="search" type="search" maxLength={70}
            placeholder="Mumbai, London, Singapore..."
            className="mt-1 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"/>
        </label>
        <label className="text-xs text-[var(--text-soft)]">
          Language
          <select name="lang" defaultValue={locale}
            className="mt-1 min-h-11 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]">
            {SUPPORTED_UI_LOCALES.map(code=><option key={code} value={code}>{code.toUpperCase()}</option>)}
          </select>
        </label>
        <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm">
          <Search size={15}/> Find my city
        </button>
      </form>
      <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-soft)]">
        <ShieldCheck size={14}/> No paid IP API, no location storage and no automatic redirect.
      </p>
    </div>
  </section>;
}
