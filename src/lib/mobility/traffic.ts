import type {MobilityCity} from "./city";

export const TRAFFIC_CITIES = ["mumbai","kolkata"] as const;
export type TrafficCity=typeof TRAFFIC_CITIES[number];
export const REPORT_KINDS=["jam","closure","hazard","clear"] as const;
export type ReportKind=typeof REPORT_KINDS[number];
export type TrafficZone={id:string;label:string;localLabel:string};
export type TrafficReport={id:string;zone:string;kind:ReportKind;createdAt:string;expiresAt:string};
export type TrafficFeed={zones:TrafficZone[];reports:TrafficReport[]};
export const isTrafficCity=(value:unknown):value is TrafficCity=>TRAFFIC_CITIES.some(city=>city===value);
export const isReportKind=(value:unknown):value is ReportKind=>REPORT_KINDS.some(kind=>kind===value);
export const validTrafficZone=(value:unknown):value is string=>typeof value==="string"&&/^[a-z0-9-]{2,40}$/.test(value);
export const validReportId=(value:unknown):value is string=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function trafficCityFor(city:MobilityCity):TrafficCity|null{
  const name=city.name.trim().toLocaleLowerCase("en");
  return city.countryCode==="IN"&&isTrafficCity(name)?name:null;
}
export function reportsForZone(reports:TrafficReport[],zone:string,now=Date.now()){
  return reports.filter(item=>(!zone||item.zone===zone)&&Date.parse(item.expiresAt)>now);
}
