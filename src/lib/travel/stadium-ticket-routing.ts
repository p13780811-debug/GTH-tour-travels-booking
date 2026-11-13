import {stadiums} from "./stadiums";

/** Route only a uniquely identified reviewed venue. Never turn a partial
 * geography match (e.g. Eden / Sweden) into a tour or live ticket claim.
 */
const normalize=(value:string)=>value.normalize("NFKD").replace(/\p{M}/gu,"")
 .toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
const intent=/\b(?:find|search|book|buy|official|live|cricket|sports?|matches?|games?|events?|tickets?|stadiums?|venues?|tours?|guides?|for|in|near|at)\b/gi;

export function knownStadiumTicketHref(input:unknown):string|null {
 if(typeof input!=="string"||input.length>100)return null;
 const cleaned=normalize(input.replace(intent," "));
 if(cleaned.length<4)return null;
 const matches=stadiums.filter(stadium=>{
  const name=normalize(stadium.name.replace(intent," ")),city=normalize(stadium.city);
  return cleaned===name||cleaned===name+" "+city||cleaned===city+" "+name;
 });
 return matches.length===1?"/stadiums/"+matches[0].slug:null;
}
