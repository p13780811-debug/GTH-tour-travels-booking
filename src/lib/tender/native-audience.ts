// Pure audience helpers for native Worker reads. Parity with the existing
// server-only localization contract is covered by regression tests.
export const COUNTRY_CODES = new Set(
  ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW").split(" ")
);

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
