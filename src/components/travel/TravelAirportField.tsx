"use client";
import {useId,useState} from "react";
import {MapPin,Plane} from "lucide-react";
import {airportIndex} from "@/lib/travel/nuiteeAirportIndex";
import styles from "./ConnectedTravelWorkspace.module.css";
export function airportLabel(code:string){const airport=airportIndex.find(item=>item.code===code);return airport?`${airport.city} (${airport.code})`:code;}
export function airportCode(query:string):string{
 const text=query.trim();
 const code=/\(([A-Z]{3})\)$/.exec(text)?.[1];if(code)return code;
 if(/^[A-Z]{3}$/.test(text))return text;
 const matches=airportIndex.filter(item=>item.city.toLocaleLowerCase()===text.toLocaleLowerCase()||item.name.toLocaleLowerCase()===text.toLocaleLowerCase());
 if(matches.length)return matches.length===1?matches[0].code:"";
 return /^[A-Za-z]{3}$/.test(text)?text.toUpperCase():"";
}
export default function TravelAirportField({label,value,code,onType,onSelect}:{label:string;value:string;code:string;onType:(value:string)=>void;onSelect:(code:string)=>void}){
 const id=useId(),[open,setOpen]=useState(false),[active,setActive]=useState(-1),needle=value.replace(/\s*\([A-Z]{3}\)$/,"").toLocaleLowerCase().trim();
 const suggestions=airportIndex.filter(item=>!needle||item.code.toLowerCase().includes(needle)||item.city.toLocaleLowerCase().includes(needle)||item.name.toLocaleLowerCase().includes(needle)).slice(0,6);
 const airport=airportIndex.find(item=>item.code===code);
 function select(selected:string){onSelect(selected);setOpen(false);setActive(-1);}
 return <div className={styles.airportField}>
  <label htmlFor={id}>{label}</label>
  <div className={styles.airportInput}><Plane size={19} aria-hidden="true"/><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open&&suggestions.length>0} aria-controls={id+"-options"} aria-activedescendant={open&&suggestions[active]?id+"-option-"+active:undefined} value={value} maxLength={100} placeholder="City or airport" autoComplete="off" onFocus={()=>{setOpen(true);setActive(-1);}} onBlur={()=>setOpen(false)} onChange={event=>{onType(event.target.value);setOpen(true);setActive(-1);}} onKeyDown={event=>{
   if(event.key==="Escape"){setOpen(false);return;}
   if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();setOpen(true);setActive(index=>suggestions.length?(index<0?(event.key==="ArrowDown"?0:suggestions.length-1):(index+(event.key==="ArrowDown"?1:suggestions.length-1))%suggestions.length):-1);}
   if(event.key==="Enter"&&open&&suggestions[active]){event.preventDefault();select(suggestions[active].code);}
  }}/></div>
  <span className={styles.airportHint}>{airport?.name||(code?code+" · confirm the airport before booking":"Airport name or three-letter code")}</span>
  <div id={id+"-options"} role="listbox" aria-label={label+" suggestions"} hidden={!open||!suggestions.length} className={styles.airportOptions}>
   {suggestions.map((item,index)=><button key={item.code} id={id+"-option-"+index} type="button" role="option" aria-selected={active===index} tabIndex={-1} onPointerDown={event=>event.preventDefault()} onClick={()=>select(item.code)}><MapPin size={16} aria-hidden="true"/><span><strong>{item.city}</strong><small>{item.name}</small></span><b>{item.code}</b></button>)}
  </div>
 </div>;
}
