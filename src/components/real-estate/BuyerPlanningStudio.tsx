"use client";
import {useState} from "react";
import {affordabilityEstimate,ownershipEstimate,rentalYieldEstimate,yearlyAmortization,type OwnershipInputs} from "@/lib/real-estate/buyer-planning";
import {downloadResearchText} from "@/lib/real-estate/browser-download";
const fields=[
 ["price","Property asking price"],["downPayment","Your down payment"],["upfrontCosts","All upfront fees and setup costs"],
 ["annualRate","Your fixed annual interest assumption (%)"],["years","Loan term (whole years)"],
 ["annualTax","Annual property taxes"],["annualInsurance","Annual insurance"],
 ["monthlyMaintenance","Monthly maintenance / service charges"],["monthlyOther","Other monthly ownership costs"],
] as const;
type Field=typeof fields[number][0];
const empty:Record<Field,string>={price:"",downPayment:"",upfrontCosts:"",annualRate:"",years:"",annualTax:"",annualInsurance:"",monthlyMaintenance:"",monthlyOther:""};
export default function BuyerPlanningStudio(){
 const [values,setValues]=useState(empty),[currency,setCurrency]=useState("INR"),[view,setView]=useState("ownership");
 const [budget,setBudget]=useState(""),[rent,setRent]=useState(""),[vacancy,setVacancy]=useState("0"),[message,setMessage]=useState("");
 const input=Object.fromEntries(fields.map(([key])=>[key,Number(values[key])])) as OwnershipInputs;
 const ready=["price","downPayment","annualRate","years"].every(key=>values[key as Field].trim()!=="");
 const result=ready?ownershipEstimate(input):null;
 const affordable=result&&budget!==""?affordabilityEstimate(Number(budget),result.recurringMonthly,input.downPayment,input.annualRate,input.years):null;
 const rental=result&&rent!==""&&vacancy!==""?rentalYieldEstimate(input.price,input.upfrontCosts,Number(rent),Number(vacancy),result.recurringMonthly*12):null;
 const schedule=result?.loan?yearlyAmortization(result.loan,input.annualRate,input.years):[];
 const money=(n:number)=>new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:0}).format(n);
 const fieldClass="mt-2 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]";
 return <section id="buyer-planning-studio" aria-labelledby="buyer-planning-title" className="gth-glass mt-8 scroll-mt-24 rounded-3xl border border-[var(--border)] p-5 sm:p-8">
  <p className="gold-text text-xs uppercase tracking-widest">Buyer decision tools</p><h2 id="buyer-planning-title" className="mt-3 text-2xl font-bold">Plan the complete cost of your next property</h2>
  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Use your own figures in any supported currency. Currency changes the label only; amounts are never converted. Inputs stay in this page and are not sent to a lender.</p>
  <div role="group" aria-label="Buyer planning tools" className="mt-5 flex flex-wrap gap-2">{[["ownership","Total ownership cost"],["affordability","Affordability"],["yield","Rental scenario"]].map(([key,label])=><button key={key} type="button" aria-pressed={view===key} onClick={()=>setView(key)} className={(view===key?"gth-btn-gold":"gth-btn")+" min-h-11 rounded-xl px-4 text-sm"}>{label}</button>)}</div>
  <div className="mt-6 grid gap-6 lg:grid-cols-2">
   <form aria-label="Your ownership assumptions" onSubmit={event=>event.preventDefault()} className="grid content-start gap-4 sm:grid-cols-2">
    <label className="text-sm sm:col-span-2">Currency<select value={currency} onChange={event=>setCurrency(event.target.value)} className={fieldClass}>{["INR","AED","USD","GBP","EUR","SGD"].map(code=><option key={code}>{code}</option>)}</select></label>
    {fields.map(([key,label])=><label key={key} className="text-sm">{label}<input name={key} type="number" min="0" max={key==="annualRate"||key==="years"?40:1e12} step={key==="years"?1:"any"} value={values[key]} onChange={event=>setValues(previous=>({...previous,[key]:event.target.value}))} className={fieldClass}/></label>)}
    <p className="text-xs leading-6 text-[var(--text-soft)] sm:col-span-2">Enter price, down payment, rate and term first. Blank cost fields contribute zero to this illustration. Add your own taxes, insurance, maintenance and all quoted fees before using the total. No local tax rates are inferred.</p>
   </form>
   <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
    {view==="ownership"?<><h3 className="text-xl font-semibold">Cash needed and monthly ownership</h3>{result?<>
     <dl className="mt-5 grid gap-4">{[["Cash needed initially",result.cashRequired],["Loan principal",result.loan],["Monthly loan repayment",result.repayment.monthly],["Other monthly ownership costs",result.recurringMonthly],["Estimated monthly total",result.monthlyTotal],["Total loan interest",result.repayment.interest]].map(([label,value])=><div key={String(label)}><dt className="text-sm text-[var(--text-soft)]">{label}</dt><dd className="mt-1 text-lg font-semibold">{money(Number(value))}</dd></div>)}</dl>
     <h4 className="mt-6 font-semibold">What if the annual rate changes?</h4><ul className="mt-3 space-y-2 text-sm">{result.stress.map(row=><li key={row.rate}>{row.rate.toFixed(2)}% → {money(row.monthly)} / month including your ongoing costs</li>)}</ul>
     {schedule.length>0&&<details className="mt-5"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Yearly repayment breakdown</summary><div role="region" aria-label="Yearly repayment table" tabIndex={0} className="overflow-x-auto"><table className="mt-3 w-full min-w-[430px] text-left text-xs"><thead><tr>{["Year","Principal","Interest","Balance"].map(label=><th scope="col" key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{schedule.map(row=><tr key={row.year} className="border-t border-[var(--border)]"><th scope="row" className="p-2">{row.year}</th><td className="p-2">{money(row.principal)}</td><td className="p-2">{money(row.interest)}</td><td className="p-2">{money(row.balance)}</td></tr>)}</tbody></table></div><button type="button" className="gth-btn mt-4 min-h-11" onClick={()=>{const csv="Year,Principal repaid,Interest paid,Remaining balance,Currency\r\n"+schedule.map(row=>[row.year,row.principal.toFixed(2),row.interest.toFixed(2),row.balance.toFixed(2),currency].join(",")).join("\r\n");setMessage(downloadResearchText(csv,"text/csv;charset=utf-8","gth-illustrative-amortization.csv")?"Illustrative schedule downloaded.":"Download unavailable in this browser.");}}>Download repayment CSV</button></details>}
    </>:<p className="mt-4 text-sm leading-7">Enter valid assumptions. Down payment must not exceed price; rate must be 0–40% and term 1–40 whole years.</p>}</>:view==="affordability"?<>
     <h3 className="text-xl font-semibold">Work backwards from your monthly budget</h3><label className="mt-4 block text-sm">Your maximum monthly housing budget<input name="monthlyBudget" type="number" min="0" max={1e12} value={budget} onChange={event=>setBudget(event.target.value)} className={fieldClass}/></label>
     {affordable?<dl className="mt-5 space-y-4"><div><dt>Illustrative purchase budget</dt><dd className="gold-text mt-2 text-2xl font-semibold">{money(affordable.purchaseBudget)}</dd></div><div><dt>Illustrative loan amount</dt><dd>{money(affordable.loan)}</dd></div></dl>:<p className="mt-4 text-sm">Complete the ownership assumptions and enter a budget covering your ongoing costs.</p>}
     <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Uses your down payment, rate, term and ongoing costs. Upfront fees need additional cash. This is a mathematical scenario, not a recommendation, credit assessment or pre-approval.</p>
    </>:<><h3 className="text-xl font-semibold">Compare a rental-income scenario</h3><label className="mt-4 block text-sm">Your expected monthly rent<input name="expectedRent" type="number" min="0" max={1e12} value={rent} onChange={event=>setRent(event.target.value)} className={fieldClass}/></label><label className="mt-4 block text-sm">Vacant months per year<input name="vacantMonths" type="number" min="0" max="12" step="0.5" value={vacancy} onChange={event=>setVacancy(event.target.value)} className={fieldClass}/></label>
     {rental?<dl className="mt-5 space-y-3">{[["Potential annual rent before vacancy",money(rental.grossRent)],["Annual rent after vacancy allowance",money(rental.collectedRent)],["Net operating income",money(rental.netIncome)],["Gross yield on price plus upfront costs",rental.grossYield.toFixed(2)+"%"],["Net operating yield",rental.netYield.toFixed(2)+"%"]].map(([label,value])=><div key={label}><dt className="text-sm text-[var(--text-soft)]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>:<p className="mt-4 text-sm">Complete valid ownership assumptions and enter your rental expectation.</p>}
     <p className="mt-4 text-xs leading-6 text-[var(--text-soft)]">Subtracts the annualized ownership expenses you entered, before financing, income tax, appreciation or selling costs. Rent and occupancy are your assumptions, not market data or guaranteed returns.</p>
    </>}
   </div>
  </div>{message&&<p role="status" className="mt-4 text-sm">{message}</p>}
 </section>;
}
