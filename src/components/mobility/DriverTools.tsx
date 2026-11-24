"use client";

import {useEffect,useState} from "react";
import {Calculator,NotebookPen,Share2} from "lucide-react";
import {currencyChoices,currencyForCity,distanceUnit,fuelUnit,mobilityCityKey,mobilityHref,type Fuel,type FuelUnit,type MobilityCity} from "@/lib/mobility/city";
import {readShifts,shiftTotals,SHIFT_KEY,MAX_SHIFTS,upsertShift,validShift,type Shift} from "@/lib/mobility/diary";

const units:FuelUnit[]=["L","US gal","kg","GGE"];
const currencies=currencyChoices();
const todayLocal=()=>{
  const now=new Date();
  return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
};
const inputStyle="gth-input min-h-11 w-full min-w-0";
const formatMoney=(amount:number,currency:string)=>currency
  ? new Intl.NumberFormat(currency==="INR"?"en-IN":"en",{style:"currency",currency,currencyDisplay:"narrowSymbol"}).format(amount)
  : new Intl.NumberFormat("en",{maximumFractionDigits:2}).format(amount);

export default function DriverTools({city}:{city:MobilityCity}){
  const cityKey=mobilityCityKey(city);
  const distanceDefault=distanceUnit(city);
  const [fuel,setFuel]=useState<Fuel>("petrol");
  const [unit,setUnit]=useState<FuelUnit>(()=>fuelUnit(city,"petrol"));
  const [distanceMeasure,setDistanceMeasure]=useState<"km"|"mi">(distanceDefault);
  const [currency,setCurrency]=useState(()=>currencyForCity(city));
  const [date,setDate]=useState("");
  const [values,setValues]=useState({revenue:"",distance:"",efficiency:"",fuelPrice:"",other:""});
  const [rows,setRows]=useState<Shift[]>([]);
  const [notice,setNotice]=useState("");
  const [removeDate,setRemoveDate]=useState("");

  useEffect(()=>{
    setDate(todayLocal());
    const restore=()=>{
      try{setRows(readShifts(localStorage.getItem(SHIFT_KEY)));}
      catch{setNotice("Browser storage is unavailable. You can still use the calculator.");}
    };
    restore();
    const sync=(event:StorageEvent)=>{if(event.key===SHIFT_KEY||event.key===null)restore();};
    window.addEventListener("storage",sync);
    return ()=>window.removeEventListener("storage",sync);
  },[]);

  const shift:Shift={cityKey,date,currency,fuel,unit,distanceUnit:distanceMeasure,
    revenue:Number(values.revenue),distance:Number(values.distance),
    efficiency:Number(values.efficiency),fuelPrice:Number(values.fuelPrice),other:Number(values.other)};
  const hasNumbers=Object.values(values).some(Boolean);
  const hasRequiredFuel=shift.distance===0||(values.efficiency!==""&&values.fuelPrice!=="");
  const complete=validShift(shift)&&hasRequiredFuel&&hasNumbers;
  const total=complete?shiftTotals(shift):null;
  const cityRows=rows.filter(row=>row.cityKey===cityKey);

  function save(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!complete){setNotice("Choose a currency and date. For a driven shift, enter mileage and the fuel price.");return;}
    try{
      const stored=readShifts(localStorage.getItem(SHIFT_KEY));
      if(stored.length>=MAX_SHIFTS&&!stored.some(row=>row.cityKey===shift.cityKey&&row.date===shift.date)){
        setNotice("The browser diary is full. Remove an entry before saving another date.");return;
      }
      const next=upsertShift(stored,shift);
      localStorage.setItem(SHIFT_KEY,JSON.stringify(next));
      setRows(next);setNotice("Shift saved on this device.");
    }catch{setNotice("The shift could not be stored. Check your browser’s storage settings.");}
  }

  function load(row:Shift){
    setDate(row.date);setCurrency(row.currency);setFuel(row.fuel);setUnit(row.unit);setDistanceMeasure(row.distanceUnit);
    setValues({revenue:String(row.revenue),distance:String(row.distance),efficiency:String(row.efficiency),fuelPrice:String(row.fuelPrice),other:String(row.other)});
    setNotice("Entry loaded. Save the same date to update it.");
  }

  function remove(entryDate:string){
    if(removeDate!==entryDate){setRemoveDate(entryDate);return;}
    try{
      const next=readShifts(localStorage.getItem(SHIFT_KEY)).filter(row=>row.cityKey!==cityKey||row.date!==entryDate);
      localStorage.setItem(SHIFT_KEY,JSON.stringify(next));
      setRows(next);setNotice("Diary entry removed.");
    }catch{setNotice("The entry could not be removed.");}
    setRemoveDate("");
  }

  async function share(){
    const url=new URL(mobilityHref(city),window.location.origin).href;
    try{
      if(navigator.share){await navigator.share({title:city.name+" driver tools and transit",url});return;}
      await navigator.clipboard.writeText(url);
      setNotice("City tools link copied.");
    }catch(error){if(!(error instanceof DOMException&&error.name==="AbortError"))setNotice("Copy the page URL from your browser to share city tools.");}
  }

  const inputs=[
    ["revenue","Total earnings",currency],
    ["distance","Distance driven",distanceMeasure],
    ["efficiency","Vehicle mileage",distanceMeasure+" per "+unit],
    ["fuelPrice","Fuel price",currency+" per "+unit],
    ["other","Other expenses (fees, tolls, rent)",currency],
  ] as const;
  return <section id="driver-tools" aria-labelledby="driver-tools-title" className="scroll-mt-24">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h2 id="driver-tools-title" className="text-xl font-bold sm:text-2xl">Driver earnings &amp; fuel calculator</h2>
      <button onClick={share} className="gth-btn inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold" type="button"><Share2 size={16} aria-hidden="true"/> Share city tools</button>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={save} className="grid min-w-0 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-2 sm:p-5">
        <label className="text-sm font-semibold">Shift date<input required type="date" className={inputStyle} value={date} onChange={e=>setDate(e.target.value)}/></label>
        <label className="text-sm font-semibold">Currency<select className={inputStyle} required value={currency} onChange={e=>{setCurrency(e.target.value);setValues(prev=>({...prev,revenue:"",fuelPrice:"",other:""}));}}>
          <option value="">Choose currency</option>{currencies.map(code=><option key={code}>{code}</option>)}
        </select></label>
        <label className="text-sm font-semibold">Fuel<select className={inputStyle} value={fuel} onChange={e=>{
          const next=e.target.value as Fuel;setFuel(next);setUnit(fuelUnit(city,next));setValues(prev=>({...prev,efficiency:"",fuelPrice:""}));
        }}><option value="petrol">Petrol / gasoline</option><option value="diesel">Diesel</option><option value="cng">CNG</option></select></label>
        <label className="text-sm font-semibold">Fuel unit<select className={inputStyle} value={unit} onChange={e=>{
          setUnit(e.target.value as FuelUnit);setValues(prev=>({...prev,efficiency:"",fuelPrice:""}));
        }}>{(fuel==="cng"?units.filter(u=>u==="kg"||u==="GGE"):units.filter(u=>u==="L"||u==="US gal")).map(u=><option key={u}>{u}</option>)}</select></label>
        <label className="text-sm font-semibold">Distance unit<select className={inputStyle} value={distanceMeasure} onChange={e=>{
          setDistanceMeasure(e.target.value as "km"|"mi");setValues(prev=>({...prev,distance:"",efficiency:""}));
        }}><option value="km">Kilometres</option><option value="mi">Miles</option></select></label>
        {inputs.map(([key,label,suffix])=><label key={key} className="min-w-0 text-sm font-semibold">
          {label}{suffix&&<span className="ml-1 text-xs font-normal text-[var(--text-soft)]">({suffix})</span>}
          <input name={key} className={inputStyle} type="number" inputMode="decimal" step="any" min="0" max="1000000000" placeholder="0" value={values[key]}
            onChange={e=>setValues({...values,[key]:e.target.value})}/>
        </label>)}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:col-span-2" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-semibold"><Calculator size={16} aria-hidden="true"/> Estimated shift totals</p>
          {total?<dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt>Fuel used</dt><dd className="font-bold">{new Intl.NumberFormat("en",{maximumFractionDigits:2}).format(total.fuelUsed)} {unit}</dd></div>
            <div><dt>Fuel cost</dt><dd className="font-bold">{formatMoney(total.fuelCost,currency)}</dd></div>
            <div><dt>Net after expenses</dt><dd className="font-bold">{formatMoney(total.net,currency)}</dd></div>
          </dl>:<p className="mt-2 text-sm text-[var(--text-soft)]">Enter your earnings and expenses. Use the fuel price and mileage you observed.</p>}
        </div>
        <button type="submit" className="gth-btn-gold inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold sm:col-span-2">Save to Hisaab Diary</button>
      </form>
      <div className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold"><NotebookPen size={19} aria-hidden="true"/> Digital Hisaab Diary</h3>
        <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">Entries stay in this browser. Save one shift summary per city and day. Clearing browser data removes your entries.</p>
        {!cityRows.length?<p className="mt-4 text-sm text-[var(--text-soft)]">No shifts saved for {city.name}.</p>:<ul className="mt-3 space-y-2">
          {cityRows.map(row=><li key={row.date} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
            <p className="font-semibold"><time dateTime={row.date}>{row.date}</time></p>
            <p className="text-sm text-[var(--text-soft)]">Net {formatMoney(shiftTotals(row).net,row.currency)} · {row.currency}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              <button type="button" className="min-h-11 font-semibold underline" onClick={()=>load(row)}>Edit entry</button>
              <button type="button" className="min-h-11 underline" onClick={()=>remove(row.date)}>{removeDate===row.date?"Confirm removal":"Remove entry"}</button>
              {removeDate===row.date&&<button type="button" className="min-h-11 underline" onClick={()=>setRemoveDate("")}>Cancel</button>}
            </div>
          </li>)}
        </ul>}
        {notice&&<p role="status" className="mt-3 text-sm font-medium">{notice}</p>}
      </div>
    </div>
  </section>;
}
