/** Illustrative static INR-per-unit FX reference, NOT live or executable exchange rates. */
export const INR_PER_UNIT = {INR:1,USD:89,AED:24.23,GBP:117,EUR:103,SGD:69} as const;
export type InvestorCurrency=keyof typeof INR_PER_UNIT;
export function convertCurrency(amount:number,from:InvestorCurrency,to:InvestorCurrency):number|null {
 if(!Number.isFinite(amount)||amount<0||amount>1e15)return null;
 return Math.round(amount*INR_PER_UNIT[from]/INR_PER_UNIT[to]*100)/100;
}
export function displayCurrency(amount:number,from:InvestorCurrency,to:InvestorCurrency):string {
 const value=convertCurrency(amount,from,to);
 return value===null?"Unavailable":new Intl.NumberFormat("en",{style:"currency",currency:to,maximumFractionDigits:0}).format(value);
}
export const INVESTOR_CORRIDORS={
 mmr:{label:"Mumbai MMR",country:"India",city:"Mumbai"},
 kolkata:{label:"Kolkata / New Town",country:"India",city:"Kolkata"},
 dubai:{label:"Dubai",country:"United Arab Emirates",city:"Dubai"},
 london:{label:"London",country:"United Kingdom",city:"London"},
 global:{label:"Global",country:"",city:""}
} as const;
