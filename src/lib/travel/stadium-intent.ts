import {stadiums} from "./stadiums";

/**
 * Exact reviewed venue-name routing. Search for "Eden Gardens stadium tour"
 * must resolve to the Kolkata stadium guide, NEVER to a supplier search for
 * a town called "Eden". Generic city or partial words are not sufficient.
 */
const clean=(raw:string)=>raw.normalize("NFKD")
 .replace(/\p{M}/gu,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");

export function reviewedStadiumGuideHref(raw:unknown):string|null{
 if(typeof raw!=="string"||raw.length<3||raw.length>120)return null;
 const query=" "+clean(raw)+" ";
 for(const stadium of stadiums){
  const names=[stadium.name,stadium.slug.replace(/-/g," ")];
  if(names.some(name=>query.includes(" "+clean(name)+" ")))
   return "/stadiums/"+stadium.slug;
 }
 return null;
}
