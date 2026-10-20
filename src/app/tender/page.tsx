import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Building2, ClipboardCheck, FileSearch,
  Globe2, Plane, Search, ShieldCheck
} from "lucide-react";
import { parseTenderFilters, searchPublicTenders, getTenderDiscoveryStats, TENDER_SECTORS, safeTenderSource } from "@/lib/tender/catalog";
import {TenderMarketOverview, TenderMarketCard} from "@/components/tender/TenderMarketplacePanels";
import { COUNTRY_CODES, resolveTenderAudience, nearbyCountries, countryLabel, dateLabel } from "@/lib/tender/localization";
import { tenderText, LANG_OPTIONS } from "@/lib/tender/i18n";
import { tenderFilterHref } from "@/lib/tender/urls";
import { TenderWorkspaceToolbar } from "@/components/tender/TenderDiscoveryActions";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tender Opportunities & Procurement Intelligence | GTH PRO",
  description: "Search source-verified, publicly released tender notices by country, sector and deadline. Review original documents with issuing authorities.",
  alternates: { canonical: "/tender" }
};

const sources = [
  {name:"Government e-Marketplace",label:"India public procurement",url:"https://gem.gov.in"},
  {name:"Central Public Procurement Portal",label:"India e-procurement",url:"https://eprocure.gov.in/eprocure/app"},
  {name:"CPPP ePublishing",label:"India latest tender enquiries",url:"https://eprocure.gov.in/epublish/app"},
  {name:"GeM Global Bids",label:"India international competitive bids",url:"https://bidplus-global.gem.gov.in/"},
  {name:"NICSI GeM Bids",label:"India official government technology procurement",url:"https://nicsi.nic.in/nicsi/nicsi-gem-bids/"},
  {name:"UN Global Marketplace",label:"United Nations procurement",url:"https://www.ungm.org"},
  {name:"World Bank Procurement",label:"Worldwide financed projects",url:"https://projects.worldbank.org/en/projects-operations/procurement"},
  {name:"TED European Union",label:"EU procurement notices",url:"https://ted.europa.eu"},
  {name:"UK Find a Tender",label:"United Kingdom procurement",url:"https://www.find-tender.service.gov.uk"},
  {name:"Brazil PNCP",label:"Brazil public procurement",url:"https://pncp.gov.br"},
  {name:"USA SAM.gov",label:"United States federal opportunities",url:"https://sam.gov/opportunities"},
  {name:"CanadaBuys",label:"Canada official open procurement",url:"https://canadabuys.canada.ca"},
  {name:"Prozorro",label:"Ukraine public procurement",url:"https://prozorro.gov.ua"},
  {name:"UK Contracts Finder",label:"United Kingdom government tender notices",url:"https://www.contractsfinder.service.gov.uk"},
] as const;

const SOURCE_JURISDICTION:Record<string,string>={
  "Government e-Marketplace":"IN","Central Public Procurement Portal":"IN","CPPP ePublishing":"IN",
  "GeM Global Bids":"IN","NICSI GeM Bids":"IN","UN Global Marketplace":"GLOBAL",
  "World Bank Procurement":"GLOBAL","TED European Union":"EU","UK Find a Tender":"GB",
  "Brazil PNCP":"BR","USA SAM.gov":"US","CanadaBuys":"CA",
  "Prozorro":"UA","UK Contracts Finder":"GB"
};
const EU_COUNTRIES=new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "));
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function textParam(raw: string | string[] | undefined) { return typeof raw === "string" ? raw : ""; }

function filterHref(filters: {q:string;country:string;sector:string;closingBefore?:string;closingWithin?:"7";sort?:"deadline"|"newest";scope?:"local"|"world"}, page:number, lang:string) {
  const q = new URLSearchParams();
  if (filters.q) q.set("q", filters.q);
  if (filters.country) q.set("country", filters.country);
  if (filters.sector) q.set("sector", filters.sector);
  if (filters.closingBefore) q.set("closingBefore", filters.closingBefore);
  if (filters.closingWithin) q.set("closingWithin", filters.closingWithin);
  if (filters.sort && filters.sort!=="deadline") q.set("sort", filters.sort);
  if (filters.scope) q.set("scope",filters.scope);
  if (lang) q.set("lang",lang);
  q.set("page", String(page));
  return "/tender?" + q.toString();
}

export default async function TenderPage({searchParams}: Props) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const name of ["q","country","sector","closingBefore","closingWithin","sort","page","scope"] as const) {
    const value = textParam(raw[name]);
    if (value) params.set(name,value);
  }
  const parsed = parseTenderFilters(params);
  const filters = parsed.ok ? parsed.filters : { q:"", country:"", sector:"", closingBefore:"", page:1, scope:"local" as const };
  const audience=await resolveTenderAudience(filters.country,textParam(raw.lang));
  const homeCountry=filters.country||audience.country||"";
  const language=audience.language;
  const t=tenderText(language);
  const localCountry=homeCountry?countryLabel(homeCountry,language):"";
  const searchFilters={...filters,
    country:filters.scope==="world"?filters.country:homeCountry,
    nearby:filters.scope==="local"&&homeCountry?nearbyCountries(homeCountry):[]};
  const [result,marketStats]=parsed.ok
    ? await Promise.all([searchPublicTenders(searchFilters),getTenderDiscoveryStats(searchFilters)])
    : [null,null];
  const countries=Array.from(COUNTRY_CODES).sort((a,b)=>countryLabel(a,language).localeCompare(countryLabel(b,language),language));
  const visibleSources=sources.filter(source=>{
    if(filters.scope==="world")return true;
    const jurisdiction=SOURCE_JURISDICTION[source.name];
    return jurisdiction==="GLOBAL" || jurisdiction===homeCountry ||
      (jurisdiction==="EU"&&EU_COUNTRIES.has(homeCountry));
  });
  const error = !parsed.ok ? parsed.error : result && !result.ok ? result.error : null;
  const notices = result?.ok ? result.items : [];
  const count = result?.ok ? result.total : 0;
  const pageCount = result?.ok ? Math.ceil(result.total / result.size) : 0;
  return <main lang={language} dir={language==="ar"?"rtl":"ltr"} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <section className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-9 sm:px-6 md:py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
          <Globe2 size={16} aria-hidden="true" /> GTH PRO · PILLAR 03
        </p>
        <h1 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {t("hero")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)]">
          {t("intro")}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-xs text-[var(--text-soft)]">
          <ShieldCheck size={16} aria-hidden="true"/> {t("verified")}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/tender/assistant" className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2">
            <ClipboardCheck size={17} aria-hidden="true"/> {t("guided")} <ArrowRight size={17} aria-hidden="true"/>
          </Link>
          <Link href="/tender/saved" className="gth-btn inline-flex items-center justify-center gap-2">
            Saved tenders & comparison
          </Link>
        </div>
        </div>
        <aside aria-label="Tender workflow" className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">From discovery to preparation</p>
          <h2 className="mt-3 text-xl font-semibold">A clearer path to your next bid.</h2>
          <ol className="mt-5 space-y-4 text-sm">
            <li><a href="#tender-find" className="inline-flex min-h-11 items-center gap-3 underline underline-offset-4"><Search size={17} aria-hidden="true"/>Find notices by country, category and closing date</a></li>
            <li><Link href="/tender/saved" className="inline-flex min-h-11 items-center gap-3 underline underline-offset-4"><FileSearch size={17} aria-hidden="true"/>Shortlist and compare the recorded details</Link></li>
            <li><Link href="/tender/assistant" className="inline-flex min-h-11 items-center gap-3 underline underline-offset-4"><ClipboardCheck size={17} aria-hidden="true"/>
            {t("eligibility")}
            </Link></li>
            <li><a href="#readiness" className="inline-flex min-h-11 items-center gap-3 underline underline-offset-4"><ShieldCheck size={17} aria-hidden="true"/>Review documents and submit on the official portal</a></li>
          </ol>
        </aside>
      </div>
    </section>
    {result?.ok?<TenderMarketOverview filters={searchFilters} language={language} stats={marketStats} view="status"/>:null}
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14" aria-labelledby="tender-find">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">{t("discover")}</p>
          <h2 id="tender-find" className="mt-2 text-2xl font-semibold md:text-3xl">{t("find")}</h2>
        </div>
        <span className="text-sm text-[var(--text-soft)]">{result?.ok ? `${count} ${t("results")}` : "Source-backed catalog"}</span>
      </div>
      <form key={tenderFilterHref(searchFilters,language)} method="GET" action="/tender" role="search" className="grid min-w-0 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:items-end lg:p-5">
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("keywords")}
          <input name="q" maxLength={100} defaultValue={filters.q} placeholder={t("searchPlaceholder")} className="gth-input mt-2 min-w-0"/>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("country")}
          <select name="country" defaultValue={filters.country} className="gth-input mt-2 min-w-0">
            <option value="">{filters.scope==="world"?"All countries":audience.country?`${t("inCountry")}: ${countryLabel(audience.country,language)} (auto)`:t("allCountries")}</option>
            {countries.map(c=><option key={c} value={c}>{countryLabel(c,language)}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("scope")}
          <select name="scope" defaultValue={filters.scope} className="gth-input mt-2 min-w-0">
            <option value="local">{t("localScope")}</option><option value="world">{t("worldScope")}</option>
          </select>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("language")}
          <select name="lang" defaultValue={language} className="gth-input mt-2 min-w-0">
            {LANG_OPTIONS.map(l=><option value={l.code} key={l.code}>{l.label}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("sector")}
          <select name="sector" defaultValue={filters.sector} className="gth-input mt-2 min-w-0">
            <option value="">{t("allSectors")}</option>
            {TENDER_SECTORS.map(value => <option value={value} key={value}>{value[0].toUpperCase()+value.slice(1)}</option>)}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{t("deadlineFilter")}
          <input type="date" name="closingBefore" defaultValue={filters.closingBefore} className="gth-input mt-2 min-w-0"/>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">{language==="hi"?"क्रम":"Sort by"}
          <select name="sort" defaultValue={filters.sort??"deadline"} className="gth-input mt-2 min-w-0">
            <option value="deadline">{language==="hi"?"पहले जल्दी बंद होने वाले":"Closing soonest"}</option>
            <option value="newest">{language==="hi"?"पहले नए जोड़े गए":"Recently added"}</option>
          </select>
        </label>
        <label className="block min-w-0 text-xs font-semibold text-[var(--text-soft)]">Deadline window
          <select name="closingWithin" defaultValue={filters.closingWithin??""} className="gth-input mt-2 min-w-0">
            <option value="">Any upcoming deadline</option><option value="7">Closing in the next 7 days</option>
          </select>
        </label>
        <button type="submit" className="gth-btn gth-btn-gold inline-flex items-center justify-center gap-2">
          <Search size={17} aria-hidden="true"/> {t("search")}
        </button>
        <Link href={tenderFilterHref({q:"",country:homeCountry,sector:"",scope:filters.scope},language)} className="gth-btn inline-flex items-center justify-center">{t("clear")}</Link>
      </form>
      <TenderWorkspaceToolbar notices={notices} searchHref={tenderFilterHref(searchFilters,language)} searchLabel={[filters.q||"All notices",localCountry||(filters.scope==="world"?"Worldwide":"Choose country"),filters.sector,filters.closingWithin?"Closing in 7 days":""].filter(Boolean).join(" · ")}/>
      {filters.q||filters.sector||filters.closingBefore||filters.closingWithin ? <nav aria-label="Active tender filters" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs text-[var(--text-soft)]">Active filters:</span>
        {(["q","sector","closingBefore","closingWithin"] as const).map(key => filters[key] ? <Link key={key} href={tenderFilterHref({...searchFilters,[key]:undefined},language)} aria-label={"Remove " + key + " filter"} className="gth-btn inline-flex items-center justify-center gap-2">{key === "closingWithin" ? "Closing in 7 days" : filters[key]} ×</Link> : null)}
      </nav> : null}
      {result?.ok?<TenderMarketOverview filters={searchFilters} language={language} stats={marketStats} view="categories"/>:null}
      {homeCountry==="IN" && filters.scope!=="world" && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <span className="font-semibold">{t("indiaTitle")}</span>
          <a href="https://eprocure.gov.in/eprocure/app" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold underline">{t("view")} CPPP <ArrowUpRight size={14} className="inline"/></a>
          <a href="https://gem.gov.in" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold underline">{t("view")} GeM <ArrowUpRight size={14} className="inline"/></a>
          <a href="https://eprocure.gov.in/epublish/app" target="_blank" rel="noopener noreferrer nofollow" className="font-semibold underline">{t("view")} ePublishing <ArrowUpRight size={14} className="inline"/></a>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-soft)]" role="status">
        <span>{filters.scope==="world"?t("worldScope"):(localCountry?`${t("inCountry")}: ${localCountry} → ${t("nearby")}`:t("selectCountry"))}
          {result?.ok&&filters.scope==="local"&&!result.countryRequired?` · ${result.primaryCount??0} ${t("inCountry")} · ${result.nearbyCount??0} ${t("nearby")}`:""}
        </span>
        <span>{t("sourceLanguage")}</span>
      </div>
      {error ? <div role="status" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h3 className="font-semibold">{t("notConfigured")}</h3>
        <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{error}. {t("recheck")}</p>
      </div> : notices.length ? (
        <>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {notices.map(tender=><TenderMarketCard key={tender.id} tender={tender} language={language}/>)}
          </div>
          <nav aria-label="Tender results pages" className="mt-8 flex items-center justify-between gap-4">
            {filters.page>1?<Link href={filterHref(searchFilters,filters.page-1,language)} className="gth-btn inline-flex items-center justify-center">{t("previous")}</Link>:<span/>}
            <span className="text-sm text-[var(--text-soft)]">{t("page")} {filters.page} / {pageCount}</span>
            {filters.page<pageCount?<Link href={filterHref(searchFilters,filters.page+1,language)} className="gth-btn inline-flex items-center justify-center">{t("next")}</Link>:<span/>}
          </nav>
        </>
      ) : <div role="status" className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <FileSearch size={30} className="mx-auto text-[var(--gold)]" aria-hidden="true"/>
        <h3 className="mt-4 text-lg font-semibold">{result?.ok && result.countryRequired?t("selectCountry"):t("noResults")}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--text-soft)]">
          {t("noResultsInfo")}
        </p>
        <Link href="/tender" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">{t("clear")} <ArrowRight size={16}/></Link>
      </div>}
    </section>
    <section id="readiness" className="border-y border-[var(--border)] bg-[var(--card)]/60 px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">{t("readiness")}</p>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">{t("before")}</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Verify the buyer","Check the official issuing authority and latest corrigenda."],
            ["Review eligibility","Confirm prequalification, EMD, securities and local requirements."],
            ["Prepare documents","Gather financial, technical and compliance documents."],
            ["Submit officially","Apply and pay only through the authorised procurement portal."],
          ].map(([title,detail],i)=><article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
            <span className="text-xs font-bold text-[var(--gold)]">0{i+1}</span>
            <h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{detail}</p>
          </article>)}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 md:pt-16" aria-label="India official tender discovery" hidden={homeCountry!=="IN"}>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
        <h2 className="text-xl font-semibold">{t("indiaTitle")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          {t("indiaInfo")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/tender?country=IN" className="gth-btn gth-btn-gold inline-flex items-center gap-2 justify-center">View India catalog <ArrowRight size={16}/></Link>
          <a href="https://eprocure.gov.in/eprocure/app" target="_blank" rel="noopener noreferrer nofollow" className="gth-btn inline-flex items-center gap-2 justify-center">CPPP official tenders <ArrowUpRight size={16}/></a>
          <a href="https://gem.gov.in" target="_blank" rel="noopener noreferrer nofollow" className="gth-btn inline-flex items-center gap-2 justify-center">GeM official bids <ArrowUpRight size={16}/></a>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <h2 className="text-2xl font-semibold">{t("officialSources")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">These are independent official portals, not GTH PRO inventory. Check the issuing authority’s terms and eligibility.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleSources.map(s=><a key={s.url} href={safeTenderSource(s.url) || "#"} target="_blank" rel="noopener noreferrer nofollow" className="flex min-h-32 flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--gold)]">
          <span className="font-semibold">{s.name}</span><span className="mt-3 text-xs text-[var(--text-soft)]">{s.label}</span>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">{t("view")} <ArrowUpRight size={15}/></span>
        </a>)}
      </div>
    </section>
    <nav aria-label="Other GTH PRO pillars" className="mx-auto flex max-w-7xl flex-wrap gap-3 px-4 pb-12 sm:px-6">
      <Link href="/mega-aggregator" className="gth-btn inline-flex items-center gap-2 justify-center"><Globe2 size={16}/> Ecosystem</Link>
      <Link href="/travel" className="gth-btn inline-flex items-center gap-2 justify-center"><Plane size={16}/> Travel</Link>
      <Link href="/real-estate" className="gth-btn inline-flex items-center gap-2 justify-center"><Building2 size={16}/> Real Estate</Link>
    </nav>
  </main>;
}
