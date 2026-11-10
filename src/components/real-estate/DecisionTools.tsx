"use client";
import {useId,useState} from "react";
import {COMMUTE_MODES,commuteDirections,hasCommuteOrigin,type CommuteMode} from "@/lib/real-estate/discovery-quality";
import {compareRentBuy,prepaymentScenario,saleProceeds,type RentBuyInput} from "@/lib/real-estate/decision-tools";
import {downloadResearchText} from "@/lib/real-estate/browser-download";

const rentFields=[['price','Purchase price'],['down','Down payment'],['buyingFees','Buying fees and setup costs'],['annualRate','Fixed annual loan rate (%)'],['loanYears','Loan term (whole years)'],['monthlyRent','Comparable monthly rent'],['annualRentGrowth','Annual rent growth (%)'],['monthlyOwnerCosts','Monthly taxes, maintenance and insurance'],['annualAppreciation','Annual property value change (%)'],['annualInvestmentReturn','Annual investment return (%)'],['sellingPercent','Selling costs (% of future value)'],['years','Comparison period (whole years)']] as const;
const limits:Record<string,[number,number]>={annualRate:[0,40],annualRentGrowth:[0,30],annualAppreciation:[-20,30],annualInvestmentReturn:[-20,30],sellingPercent:[0,30],loanYears:[1,40],years:[1,40]};
const field="mt-2 block min-h-11 w-full rounded-xl border px-3 py-2";
export default function DecisionTools(){
 const [mode,setMode]=useState('rent'),[currency,setCurrency]=useState('INR'),[values,setValues]=useState<Record<string,string>>({}),[message,setMessage]=useState('');
 const number=(key:string)=>Number(values[key]);
 const complete=(keys:readonly string[])=>keys.every(key=>values[key]?.trim()!==''&&values[key]!==undefined);
 const rent=complete(rentFields.map(([key])=>key))?compareRentBuy(Object.fromEntries(rentFields.map(([key])=>[key,number(key)])) as RentBuyInput):null;
 const prepay=complete(['principal','loanRate','term','extra','lump'])?prepaymentScenario(number('principal'),number('loanRate'),number('term'),number('extra'),number('lump')):null;
 const sale=complete(['sale','loan','costs','taxes'])?saleProceeds(number('sale'),number('loan'),number('costs'),number('taxes')):null;
 const money=(n:number)=>new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:0}).format(n);
 const fields=mode==='rent'?rentFields:mode==='prepay'?[['principal','Current loan principal'],['loanRate','Fixed annual loan rate (%)'],['term','Remaining term (whole years)'],['extra','Extra monthly payment'],['lump','Immediate lump-sum payment']] as const:[['sale','Expected sale price'],['loan','Outstanding loan at sale'],['costs','All selling fees and costs'],['taxes','Your estimated taxes on sale']] as const;
 const last=rent?.rows.at(-1);
 return <section id="decision-tools" aria-labelledby="decision-tools-title" className="gth-glass mt-8 scroll-mt-24 rounded-3xl p-5 sm:p-8">
  <p className="gold-text text-xs uppercase tracking-widest">Explore your scenarios</p><h2 id="decision-tools-title" className="mt-3 text-2xl font-bold">Rent, buy, repay or sell</h2>
  <p className="mt-3 text-sm leading-7">Enter your own assumptions in one currency. Changing currency changes labels only. No live prices, tax rates, lender offers or investment returns are supplied. Inputs remain in this page.</p>
  <div role="group" aria-label="Decision tools" className="mt-5 flex flex-wrap gap-2">{[['rent','Rent vs buy'],['prepay','Loan prepayment'],['sale','Sale proceeds']].map(([key,label])=><button type="button" key={key} aria-pressed={mode===key} className="gth-btn min-h-11" onClick={()=>{setMode(key);setMessage('');}}>{label}</button>)}</div>
  <div className="mt-5 grid gap-6 lg:grid-cols-2"><form aria-label="Decision assumptions" onSubmit={event=>event.preventDefault()} className="grid content-start gap-4 sm:grid-cols-2">
   <label className="text-sm sm:col-span-2">Scenario currency<select className={field} value={currency} onChange={event=>setCurrency(event.target.value)}>{['INR','AED','USD','GBP','EUR','SGD','CAD','AUD','CHF','JPY','NZD','ZAR'].map(code=><option key={code}>{code}</option>)}</select></label>
   {fields.map(([key,label])=>{const [min,max]=limits[key]||(key==='loanRate'?[0,40]:key==='term'?[1,40]:[0,1e12]);return <label key={key} className="text-sm">{label}<input className={field} name={key} type="number" required min={min} max={max} step={['loanYears','years','term'].includes(key)?1:'any'} value={values[key]||''} onChange={event=>setValues(previous=>({...previous,[key]:event.target.value}))}/></label>;})}
  </form><div className="min-w-0 rounded-2xl border p-5" aria-live="polite">
   {mode==='rent'?<><h3 className="text-xl font-semibold">Equal-budget comparison</h3>{rent&&last?<><dl className="mt-4 space-y-4">{[['Buyer wealth after assumed sale',last.buyerWealth],['Renter investment balance',last.renterWealth],['Buyer minus renter wealth',last.difference],['Initial monthly loan payment',rent.monthlyRepayment]].map(([label,value])=><div key={String(label)}><dt className="text-sm opacity-70">{label}</dt><dd className="mt-1 font-semibold">{money(Number(value))}</dd></div>)}</dl><p className="mt-4 text-sm">First year ownership leads in this scenario: {rent.firstOwnershipLeadYear??'None in this period'}. Future years may reverse this result.</p><details className="mt-4"><summary className="min-h-11 cursor-pointer">Year-by-year comparison</summary><div className="overflow-x-auto" role="region" aria-label="Rent versus buy yearly results" tabIndex={0}><table className="w-full text-left text-xs"><thead><tr>{['Year','Buyer wealth','Renter wealth','Difference'].map(label=><th scope="col" className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{rent.rows.map(row=><tr key={row.year}><th scope="row" className="p-2">{row.year}</th><td className="p-2">{money(row.buyerWealth)}</td><td className="p-2">{money(row.renterWealth)}</td><td className="p-2">{money(row.difference)}</td></tr>)}</tbody></table></div><button type="button" className="gth-btn mt-4" onClick={()=>setMessage(downloadResearchText('Year,Buyer wealth,Renter wealth,Difference,Currency\r\n'+rent.rows.map(row=>[row.year,row.buyerWealth.toFixed(2),row.renterWealth.toFixed(2),row.difference.toFixed(2),currency].join(',')).join('\r\n'),'text/csv;charset=utf-8','gth-rent-buy-scenario.csv')?'Scenario downloaded.':'Download unavailable.')}>Download comparison CSV</button></details></>:<p className="mt-4 text-sm">Complete every assumption, including zero where appropriate. Down payment cannot exceed price. Terms must be 1–40 whole years.</p>}<p className="mt-4 text-xs leading-6 opacity-70">The renter invests the buyer's down payment and buying fees at the start. Each month both households have the same housing cash budget and invest any unused amount. Rent rises yearly; owner costs stay fixed. Buyer wealth includes assumed sale proceeds minus loan balance plus invested surplus. Taxes on investment gains, deposits, inflation and future changes to financing are excluded.</p></>:mode==='prepay'?<><h3 className="text-xl font-semibold">Extra-payment illustration</h3>{prepay?<dl className="mt-4 space-y-4">{[['Regular monthly payment',money(prepay.monthlyRepayment)],['Illustrative interest saved',money(prepay.interestSaved)],['Months until repayment',String(prepay.months)],['Months saved',String(prepay.monthsSaved)]].map(([label,value])=><div key={label}><dt className="text-sm opacity-70">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>:<p className="mt-4 text-sm">Enter a positive principal, rate 0–40%, term 1–40 whole years, extra payment and lump sum. Lump sum cannot exceed principal.</p>}<p className="mt-4 text-xs leading-6 opacity-70">Assumes extra payments reduce principal immediately and the regular payment stays unchanged. Fees, penalties, taxes and lender-specific rules are excluded. Confirm repayment terms with your lender.</p></>:<><h3 className="text-xl font-semibold">Cash remaining after sale</h3>{sale?<><p className="gold-text mt-4 text-3xl font-bold">{money(sale.net)}</p><p className="mt-3 text-sm">Deductions entered: {money(sale.deductions)}.</p>{sale.net<0&&<p className="mt-3 text-sm">Your assumed deductions exceed the sale price. Additional cash would be needed.</p>}</>:<p className="mt-4 text-sm">Enter the sale price and every deduction, including zero where appropriate.</p>}<p className="mt-4 text-xs leading-6 opacity-70">Price minus outstanding loan, fees and your estimated taxes. No country-specific tax calculation, professional valuation or guaranteed sale price is implied.</p></>}
  </div></div>{message&&<p role="status" className="mt-4 text-sm">{message}</p>}
 </section>;
}

type CommuteProperty = { slug: string; title: string; lat?: number; lng?: number }

export function CommutePlanner({ properties }: { properties: readonly CommuteProperty[] }) {
  const titleId = useId()
  const [destination, setDestination] = useState("")
  const [mode, setMode] = useState<CommuteMode>("driving")
  const field = "mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]"
  const routes = properties.map(property => ({
    property, href: commuteDirections(property.lat, property.lng, destination, mode),
  }))
  const hasMappedProperty = properties.some(property => hasCommuteOrigin(property.lat, property.lng))

  return <section aria-labelledby={titleId} className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
    <h3 id={titleId} className="text-lg font-semibold">Check your commute</h3>
    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Use the same destination to check routes from each property. Google Maps receives the destination and stored property coordinates when you open a route.</p>
    {hasMappedProperty ? <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="min-w-0 text-sm">Destination<input type="text" autoComplete="off" maxLength={180} placeholder="Workplace, station or landmark" className={field} value={destination} onChange={event => setDestination(event.target.value)} /></label>
        <label className="text-sm">Travel mode<select className={field} value={mode} onChange={event => setMode(event.target.value as CommuteMode)}>{COMMUTE_MODES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      </div>
      {destination.trim() && <ul className="mt-4 grid gap-2">{routes.map(({ property, href }) => <li key={property.slug} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span className="min-w-0 break-words font-semibold">{property.title}</span>
        {href ? <a className="gth-btn inline-flex min-h-11 items-center" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open route from ${property.title} in Google Maps`}>Open route in Google Maps ↗</a> : <span className="text-[var(--text-soft)]">Route unavailable for these inputs.</span>}
      </li>)}</ul>}
      <p className="mt-3 text-xs leading-6 text-[var(--text-soft)]">Confirm the exact entrance and compare travel times at the time you normally commute.</p>
    </> : <p className="mt-3 text-sm text-[var(--text-soft)]">A route needs recorded property coordinates.</p>}
  </section>
}
