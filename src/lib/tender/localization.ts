import "server-only";
import { headers } from "next/headers";

// Server-only regional preferences: inferred country comes ONLY from Vercel's
// trusted geolocation header. We never trust arbitrary client X-Country headers,
// never collect GPS/IP address and never persist a visitor's location.
// A user's explicit URL country always has priority.
export const COUNTRY_CODES = new Set(
  ("AF AL DZ AO AR AM AU AT AZ BH BD BY BE BJ BT BO BA BW BR BN BG BF BI KH CM CA CF TD CL CN CO CD CG CR CI HR CU CY CZ DK DJ DO EC EG SV EE ET FJ FI FR GA GE DE GH GR GT GN GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KW KG LA LV LB LS LR LY LT LU MG MW MY MV ML MT MR MU MX MD MN ME MA MZ MM NA NP NL NZ NI NE NG MK NO OM PK PA PG PY PE PH PL PT QA RO RU RW SA SN RS SL SG SK SI SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TN TR TM UG UA AE GB US UY UZ VE VN YE ZM ZW").split(" ")
);

// Geographic neighbours are explicitly curated; do not mislabel these as
// precise-distance ranking or as countries with existing tender inventory.
// Countries with no mapped nearby neighbours remain home-only.
const NEIGHBOURS: Record<string, string[]> = {
  IN:["NP","BT","BD","LK","MM","PK","CN"],BD:["IN","NP","BT","MM"],NP:["IN","CN","BT"],BT:["IN","CN","NP"],
  LK:["IN","MV"],PK:["IN","AF","CN","IR"],MM:["IN","BD","TH","LA","CN"],CN:["IN","NP","BT","MM","PK","MN","RU","VN","LA","KZ","KG","TJ","KP"],
  AE:["OM","SA","QA","BH","KW"],SA:["AE","BH","QA","KW","OM","JO","IQ","YE"],QA:["AE","BH","SA"],
  OM:["AE","SA","YE"],BH:["SA","QA","AE"],KW:["IQ","SA","AE"],IR:["IQ","PK","AF","TR","AZ","AM","TM"],
  IQ:["IR","TR","SY","JO","SA","KW"],IL:["JO","LB","EG","SY"],JO:["IL","SA","SY","IQ"],TR:["GR","BG","GE","AM","AZ","IR","IQ","SY"],
  DE:["FR","BE","NL","DK","PL","CZ","AT","CH","LU"],FR:["BE","LU","DE","CH","IT","ES","GB"],
  GB:["IE","FR","BE","NL"],IE:["GB"],ES:["PT","FR","MA"],PT:["ES","FR"],IT:["FR","CH","AT","SI","HR"],
  PL:["DE","CZ","SK","UA","BY","LT","RU"],CZ:["DE","PL","SK","AT"],SK:["CZ","PL","UA","HU","AT"],
  AT:["DE","CH","IT","SI","HU","SK","CZ"],CH:["FR","DE","AT","IT"],BE:["FR","NL","DE","LU","GB"],
  NL:["BE","DE","GB"],LU:["BE","FR","DE"],DK:["DE","SE","NO"],SE:["NO","FI","DK"],NO:["SE","FI","DK"],FI:["SE","NO","EE","RU"],
  UA:["PL","SK","HU","RO","MD","RU","BY"],RU:["UA","BY","EE","LV","LT","FI","NO","KZ","MN","CN"],
  RO:["HU","UA","MD","BG","RS"],HU:["AT","SK","UA","RO","RS","HR","SI"],BG:["RO","GR","TR","RS"],
  GR:["BG","TR","AL","MK"],HR:["SI","HU","RS","BA","ME"],SI:["IT","AT","HU","HR"],
  RS:["HU","RO","BG","MK","AL","ME","BA","HR"],BA:["HR","RS","ME"],AL:["ME","MK","GR"],ME:["HR","BA","RS","AL"],MK:["RS","BG","GR","AL"],
  US:["CA","MX"],CA:["US"],MX:["US","GT","BZ"],BR:["AR","UY","PY","BO","PE","CO","VE","GY","SR"],AR:["BR","UY","PY","BO","CL"],
  CL:["AR","BO","PE"],CO:["VE","BR","PE","EC","PA"],PE:["EC","CO","BR","BO","CL"],EC:["CO","PE"],
  UY:["BR","AR"],PY:["BR","AR","BO"],BO:["BR","AR","PY","PE","CL"],VE:["CO","BR","GY"],
  AU:["NZ","ID","PG"],NZ:["AU","FJ"],ID:["MY","SG","BN","TL","PG","AU"],MY:["SG","TH","ID","BN"],
  SG:["MY","ID"],TH:["MM","LA","KH","MY"],VN:["CN","LA","KH"],KH:["TH","LA","VN"],LA:["MM","TH","KH","VN","CN"],
  PH:["TW","MY","ID"],JP:["KR","TW","CN"],KR:["JP","CN"],TW:["JP","PH","CN"],KZ:["RU","CN","KG","UZ","TM"],
  ZA:["NA","BW","ZW","MZ","LS"],NG:["BJ","NE","TD","CM"],KE:["UG","TZ","ET","SO"],ET:["KE","SO","SD","SS","DJ"],
  EG:["LY","SD","IL"],MA:["DZ","ES"],DZ:["MA","TN","LY","NE","ML"],GH:["CI","BF","TG"],TZ:["KE","UG","RW","BI","ZM","MW","MZ"],
};

export type TenderScope = "local"|"world";
export type TenderLocale = "en"|"hi"|"bn"|"ta"|"te"|"mr"|"fr"|"es"|"pt"|"de"|"ar"|"uk"|"ru"|"zh"|"ja";
const LOCALES = new Set<TenderLocale>(["en","hi","bn","ta","te","mr","fr","es","pt","de","ar","uk","ru","zh","ja"]);
const DEFAULT_LANGUAGE:Record<string,TenderLocale>={
  IN:"hi",BD:"bn",FR:"fr",DE:"de",AT:"de",CH:"de",ES:"es",MX:"es",AR:"es",CO:"es",
  BR:"pt",PT:"pt",AE:"ar",SA:"ar",QA:"ar",EG:"ar",UA:"uk",RU:"ru",CN:"zh",TW:"zh",JP:"ja",
};
export function validCountry(raw:string|null|undefined):string|null {
  const country=(raw??"").trim().toUpperCase();
  return COUNTRY_CODES.has(country)?country:null;
}
export function nearbyCountries(home:string):string[] { return (NEIGHBOURS[home]??[]).filter(c=>COUNTRY_CODES.has(c)); }
export function validLanguage(raw:string|null|undefined):TenderLocale|null {
  const language=(raw??"").trim().toLowerCase().split("-")[0] as TenderLocale;
  return LOCALES.has(language)?language:null;
}
export function preferLanguage(accept:string|null, country:string|null, selected?:string|null):TenderLocale {
  if(selected) { const explicit=validLanguage(selected); if(explicit) return explicit; }
  if(accept){
    // The browser's highest-priority accepted language wins; q=0 means excluded.
    const prefs=accept.split(",").slice(0,12).map((s,index)=>{
      const [tag,...props]=s.trim().split(";");
      const q=props.find(p=>p.trim().startsWith("q="));
      const weight=q?Number(q.trim().slice(2)):1;
      return {language:validLanguage(tag),weight:Number.isFinite(weight)?weight:0,index};
    }).filter(p=>p.language && p.weight>0).sort((a,b)=>b.weight-a.weight||a.index-b.index);
    if(prefs[0]) return prefs[0].language!;
  }
  return (country&&DEFAULT_LANGUAGE[country]) || "en";
}
export async function resolveTenderAudience(explicitCountry?:string, explicitLanguage?:string){
  const h=await headers();
  const detected=validCountry(h.get("x-vercel-ip-country")); // Vercel's coarse IP-based estimate
  const country=validCountry(explicitCountry)||detected;
  const language=preferLanguage(h.get("accept-language"),country,explicitLanguage);
  return {country,language,detectedCountry:detected,nearby:country?nearbyCountries(country):[]};
}
export function countryLabel(country:string,locale:TenderLocale){
  try {return new Intl.DisplayNames([locale,"en"],{type:"region"}).of(country)||country}
  catch {return country}
}
export function dateLabel(iso:string,locale:TenderLocale){
  const date=new Date(iso);
  if(!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeZone:"UTC"}).format(date);
}
