import type {MobilityCity} from "./city";
import {trafficCityFor} from "./traffic";

const CHALLAN={label:"challan",href:"https://echallan.parivahan.gov.in/index/accused-challan"} as const;
type OfficialSource={label:"rules"|"cameras"|"challan"|"official";href:string;location?:string;historical?:boolean};

export function officialTrafficSources(city:MobilityCity):OfficialSource[]{
  const pilot=trafficCityFor(city);
  if(pilot==="mumbai")return [
    {label:"official",href:"https://trafficpolicemumbai.maharashtra.gov.in/en/notices/"},
    {label:"rules",href:"https://highwaypolice.maharashtra.gov.in/notification/",location:"Atal Setu · Mumbai–Pune"},
    {label:"cameras",href:"https://bprd.mha.gov.in/uploads/pdf/Best%20Practice%20on%20Smart%20Policing.pdf",location:"JJ Bridge",historical:true},
    CHALLAN,
  ];
  if(pilot==="kolkata")return [
    {label:"rules",href:"https://www.kolkatatrafficpolice.gov.in/guidelines_for_drivers.html"},
    {label:"cameras",href:"https://kolkatatrafficpolice.gov.in/Traffic%20Enforcement%20Policy.pdf"},
    CHALLAN,
  ];
  return city.countryCode==="IN"?[CHALLAN]:[];
}
