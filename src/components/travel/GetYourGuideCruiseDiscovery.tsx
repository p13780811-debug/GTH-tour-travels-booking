import {ArrowUpRight, Compass, Globe2, Ship, Waves} from "lucide-react";
import {
  buildGetYourGuideCruiseDiscovery,
  GETYOURGUIDE_PARTNER_ID,
  type GetYourGuideCruiseIntent,
} from "@/lib/travel/cruise-provider-search";

/**
 * Cruise-only affiliate discovery. Widgets use GetYourGuide's documented
 * activity-widget attributes and the existing, once-per-page analyzer loader.
 * No API token, inventory feed, speculative price or booking state is used.
 */
type DiscoveryItem = {
  label: string;
  city: string;
  intent: GetYourGuideCruiseIntent;
  note: string;
};
const CRUISE_STYLES: readonly DiscoveryItem[] = [
  {label:"Harbour cruises",city:"Hong Kong",intent:"harbour",note:"Sightseeing and skyline"},
  {label:"Sunset cruises",city:"Kolkata",intent:"sunset",note:"Evening cruises"},
  {label:"Dinner cruises",city:"Dubai",intent:"dinner",note:"Dining on the water"},
  {label:"Yacht & sailing",city:"Mumbai",intent:"yacht",note:"Small-group and private"},
  {label:"River cruises",city:"Singapore",intent:"river",note:"Waterfront sightseeing"},
  {label:"Houseboats",city:"Kerala",intent:"houseboat",note:"Backwater journeys"},
  {label:"Island boat tours",city:"Andaman",intent:"island",note:"Coastal discovery"},
  {label:"Cruise holidays",city:"Singapore",intent:"holiday",note:"Multi-day sailings"},
];
const PORTS: readonly DiscoveryItem[] = [
  {label:"Mumbai",city:"Mumbai",intent:"yacht",note:"Harbour & yachts"},
  {label:"Kolkata",city:"Kolkata",intent:"river",note:"Hooghly River"},
  {label:"Goa",city:"Goa",intent:"dinner",note:"Mandovi River"},
  {label:"Kerala",city:"Kerala",intent:"houseboat",note:"Backwaters"},
  {label:"Andaman",city:"Andaman",intent:"island",note:"Island waters"},
  {label:"Singapore",city:"Singapore",intent:"river",note:"River sightseeing"},
  {label:"Dubai",city:"Dubai",intent:"dinner",note:"Marina dining"},
  {label:"Hong Kong",city:"Hong Kong",intent:"harbour",note:"Victoria Harbour"},
];
const WIDGETS = [
  {key:"mumbai",title:"Mumbai harbour experiences",city:"Mumbai",intent:"harbour",query:"Mumbai harbour cruise",campaign:"gthpro_cruises_widget_mumbai"},
  {key:"kolkata",title:"Kolkata river experiences",city:"Kolkata",intent:"river",query:"Kolkata river cruise",campaign:"gthpro_cruises_widget_kolkata"},
  {key:"dubai",title:"Dubai dinner cruise experiences",city:"Dubai",intent:"dinner",query:"Dubai dinner cruise",campaign:"gthpro_cruises_widget_dubai"},
] as const;

const sponsored = "noopener noreferrer sponsored";

export default function GetYourGuideCruiseDiscovery({destination=""}:{destination?:string}) {
  const city=destination.trim();
  const focused=city?buildGetYourGuideCruiseDiscovery(city,"harbour"):null;
  return (
    <section id="getyourguide-cruises" aria-labelledby="getyourguide-cruises-heading" className="mt-10 scroll-mt-24">
      <header className="gth-glass rounded-2xl border border-[var(--border)] p-5 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]">
          <Waves size={17} aria-hidden="true"/> GTH PRO · GetYourGuide
        </p>
        <h2 id="getyourguide-cruises-heading" className="mt-3 text-2xl font-bold sm:text-3xl">
          Explore more cruises and water experiences
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">
          Discover worldwide harbour cruises, sailing, dinner cruises, river boats and island experiences.
          These links search GetYourGuide directly; only the provider confirms a matching experience, dates,
          current prices and booking availability.
        </p>
        {focused && (
          <a href={focused} target="_blank" rel={sponsored}
             className="gth-btn-gold mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">
            Search more in {city} <ArrowUpRight size={16} aria-hidden="true"/>
          </a>
        )}
      </header>

      <div className="mt-7">
        <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          <Ship size={19} aria-hidden="true" className="text-[var(--gold)]"/> Browse by cruise style
        </h3>
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CRUISE_STYLES.map(item=>{
            const href=buildGetYourGuideCruiseDiscovery(city||item.city,item.intent);
            return href?(
              <a key={item.intent} data-gyg-cruise-style={item.intent} href={href}
                 target="_blank" rel={sponsored}
                 className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 text-[var(--text)] transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">
                <span className="min-w-0">
                  <strong className="block text-sm">{item.label}</strong>
                  <span className="mt-1 block text-xs text-[var(--text-soft)]">{city||item.city} · {item.note}</span>
                </span>
                <ArrowUpRight size={17} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
              </a>
            ):null;
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          <Globe2 size={19} aria-hidden="true" className="text-[var(--gold)]"/> Explore popular waters
        </h3>
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
          {PORTS.map(item=>{
            const href=buildGetYourGuideCruiseDiscovery(item.city,item.intent);
            return href?(
              <a key={item.city} data-gyg-cruise-destination={item.city} href={href}
                 target="_blank" rel={sponsored}
                 className="flex min-w-0 flex-col justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-4 transition-colors hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] sm:px-4">
                <span className="flex items-center justify-between gap-2">
                  <strong className="min-w-0 text-sm">{item.label}</strong>
                  <ArrowUpRight size={15} className="shrink-0 text-[var(--gold)]" aria-hidden="true"/>
                </span>
                <span className="text-xs text-[var(--text-soft)]">{item.note}</span>
              </a>
            ):null;
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
          <Compass size={19} aria-hidden="true" className="text-[var(--gold)]"/> GetYourGuide activity highlights
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          These official activity widgets are provider-managed recommendations, not a verified cruise-only inventory feed.
          Related non-cruise activities may appear. Direct tracked searches remain available if widgets are blocked.
        </p>
        <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3">
          {WIDGETS.map(item=>{
            const fallback=buildGetYourGuideCruiseDiscovery(item.city,item.intent);
            if(!fallback)return null;
            return (
              <article key={item.key} className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
                <h4 className="text-base font-bold">{item.title}</h4>
                <div className="mt-3 min-w-0"
                     data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
                     data-gyg-locale-code="en-US"
                     data-gyg-widget="activities"
                     data-gyg-number-of-items="3"
                     data-gyg-cmp={item.campaign}
                     data-gyg-partner-id={GETYOURGUIDE_PARTNER_ID}
                     data-gyg-q={item.query}
                     aria-label={item.title+" from GetYourGuide"}>
                  <span className="text-xs text-[var(--text-soft)]">
                    Powered by <a href={fallback} rel={sponsored} target="_blank" className="underline">GetYourGuide</a>
                  </span>
                </div>
                <a href={fallback} target="_blank" rel={sponsored}
                   className="gth-btn-gold mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-center text-sm font-semibold">
                  Explore on GetYourGuide <ArrowUpRight size={16} aria-hidden="true"/>
                </a>
              </article>
            );
          })}
        </div>
      </div>
      <p className="mt-5 text-xs leading-6 text-[var(--text-soft)]">
        Affiliate disclosure: GTH PRO may receive a commission from qualifying GetYourGuide referrals.
        Search and widget results depend on GetYourGuide. Checkout, prices, operator details, cancellations and support
        are handled by the provider; no booking or payment is processed on GTH PRO.
      </p>
    </section>
  );
}
