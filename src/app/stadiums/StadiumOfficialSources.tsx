import {ArrowUpRight,Globe2,ShieldCheck} from "lucide-react";

/** Public, non-affiliate publisher/organizer entry points.
 * No ticket inventory, commercial approval or live availability is implied.
 * Add approved affiliate destinations at the provider layer later.
 */
export const officialEventSources=[
  {region:"Global",name:"FIFA",kind:"International football",url:"https://www.fifa.com/tickets"},
  {region:"Global",name:"Formula 1",kind:"Motorsport events",url:"https://www.formula1.com/en/racing"},
  {region:"Global",name:"ICC",kind:"International cricket",url:"https://www.icc-cricket.com/"},
  {region:"India",name:"BCCI",kind:"Cricket fixtures and announcements",url:"https://www.bcci.tv/"},
  {region:"India",name:"Indian Premier League",kind:"Cricket fixtures and official notices",url:"https://www.iplt20.com/"},
  {region:"Europe",name:"UEFA",kind:"European football competitions",url:"https://www.uefa.com/"},
  {region:"United Kingdom",name:"Premier League",kind:"English football fixtures",url:"https://www.premierleague.com/"},
  {region:"United States / Canada",name:"NBA",kind:"Basketball schedule and ticket information",url:"https://www.nba.com/schedule"},
  {region:"United States / Canada",name:"MLB",kind:"Baseball games and team ticketing",url:"https://www.mlb.com/schedule"},
  {region:"United States / Canada",name:"NFL",kind:"American football schedule",url:"https://www.nfl.com/schedules/"},
  {region:"United States / Canada",name:"NHL",kind:"Ice hockey schedule",url:"https://www.nhl.com/schedule"},
  {region:"Australia",name:"Australian Football League",kind:"Australian rules fixtures",url:"https://www.afl.com.au/fixture"},
  {region:"Australia",name:"Cricket Australia",kind:"Australian cricket fixtures",url:"https://www.cricket.com.au/"},
  {region:"Japan",name:"NPB",kind:"Japanese professional baseball",url:"https://npb.jp/eng/"},
] as const;

export default function StadiumOfficialSources(){
  return <section id="official-stadium-sources" aria-labelledby="official-stadium-sources-title" className="mt-8 scroll-mt-24">
    <div className="mb-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--gold)]"><Globe2 size={17} aria-hidden="true"/> Official global sources</p>
      <h2 id="official-stadium-sources-title" className="mt-2 text-2xl font-bold sm:text-3xl">Still looking? Explore official event sources</h2>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--text-soft)]">If our reviewed listings do not cover your match, use the relevant league or organizer to find its official schedule and authorized ticket seller. These are external official information entry points, not guaranteed booking links or GTH PRO affiliate offers.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{officialEventSources.map(source=><article key={source.name} className="gth-glass flex flex-col rounded-2xl border border-[var(--border)] p-5">
      <p className="text-xs font-bold text-[var(--gold)]">{source.region}</p>
      <h3 className="mt-2 text-lg font-bold">{source.name}</h3>
      <p className="mt-2 flex-1 text-sm text-[var(--text-soft)]">{source.kind}</p>
      <a href={source.url} target="_blank" rel="noopener noreferrer" className="gth-btn mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold">Official website <ArrowUpRight size={16} aria-hidden="true"/></a>
    </article>)}</div>
    <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-[var(--text-soft)]"><ShieldCheck size={16} className="mt-1 shrink-0" aria-hidden="true"/> Official source links are independent of affiliate tracking. Follow the event organizer's authorized purchase flow and verify dates, venue, seat availability, pricing and refund rules. We do not claim worldwide inventory coverage.</p>
  </section>;
}
