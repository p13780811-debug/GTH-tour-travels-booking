import type {MobilityCity} from "./city";

const modes = [
  ["train","Local trains","railway station"],
  ["metro","Metro","subway station"],
  ["bus","City buses","bus station"],
  ["airport","Airport connections","airport"],
] as const;
type Mode=typeof modes[number][0];
type Source={ label:string; href:string; detail:string };
const RTA="https://rta.ae/wps/portal/rta/ae/public-transport/journeyplanner?lang=en";
const TFL="https://tfl.gov.uk/plan-a-journey/";
const MTA="https://www.mta.info/";
const DMRC="https://delhimetrorail.com/network_map";
const KOLKATA_METRO="https://mtp.indianrailways.gov.in/";
const MUMBAI_AIRPORT="https://csmia-mumbai.adaniairports.com/en/airport-facilities/transport";
const BLR_AIRPORT="https://www.bengaluruairport.com/travellers/transport-parking/bus";

const citySources:Readonly<Record<string,Partial<Record<Mode,Source>>>>={
  "IN:mumbai":{
    train:{label:"Western Railway suburban timetable",href:"https://wr.indianrailways.gov.in/offerings/custom/Mumbai%20Suburban/preview/523",
      detail:"Use Churchgate for the Western corridor. Check Central and Harbour services separately for CSMT-side journeys."},
    metro:{label:"Mumbai Metro Line 3",href:"https://www.mmrcl.com/",
      detail:"Use the Aqua Line map to find the airport terminal stops and interchange points."},
    bus:{label:"Mumbai airport BEST bus guide",href:"https://www.adanione.com/csmia-mumbai-airport/services/bus-service",
      detail:"The airport lists route 312 for Terminal 1 and routes 321 and 308 for Terminal 2. Check timings before travelling."},
    airport:{label:"CSMIA ground transport",href:MUMBAI_AIRPORT,
      detail:"Check your terminal first. The airport guide covers metro, suburban rail connections, buses and the inter-terminal coach."},
  },
  "IN:kolkata":{
    train:{label:"Eastern Railway",href:"https://er.indianrailways.gov.in/",detail:"Check your departure station and train before travelling from Howrah or Sealdah."},
    metro:{label:"Metro Railway Kolkata",href:KOLKATA_METRO,detail:"Check the current line timetable and interchanges before leaving."},
    bus:{label:"Kolkata airport bus information",href:"https://www.aai.aero/en/airports/transport-details/kolkata/Bus-Services",detail:"Use the airport authority’s transport page when planning a bus connection."},
    airport:{label:"Jai Hind Bimanbandar timetable",href:"https://mtp.indianrailways.gov.in/offerings/schemes-and-services/preview/132",detail:"Check the Yellow Line timetable for the Noapara–Jai Hind Bimanbandar airport section."},
  },
  "IN:delhi":{
    train:{label:"Northern Railway",href:"https://nr.indianrailways.gov.in/",detail:"Check which Delhi station your train uses."},
    metro:{label:"DMRC journey planner",href:DMRC,detail:"Use the official map to compare lines, interchange stations and route choices."},
    bus:{label:"DTC services and timetable",href:"https://dtc.delhi.gov.in/dtc/services-and-time-table",detail:"Check local, night and airport bus services by route."},
    airport:{label:"DMRC Airport Express planner",href:DMRC,detail:"Use the Airport Express route and confirm the station for your airport terminal."},
  },
  "IN:bengaluru":{
    train:{label:"South Western Railway",href:"https://swr.indianrailways.gov.in/",detail:"Confirm your boarding station and scheduled train in the official enquiry tool."},
    metro:{label:"Namma Metro",href:"https://english.bmrc.co.in/",detail:"Check the operating network and interchange points before travelling."},
    airport:{label:"Bengaluru airport transport",href:BLR_AIRPORT,detail:"Check the airport operator’s bus and ground transport information for your terminal."},
  },
  "AE:dubai":{
    metro:{label:"Dubai RTA journey planner",href:RTA,detail:"Plan your trip by metro and check transfers to other services."},
    bus:{label:"Dubai RTA bus timetables",href:"https://rta.ae/wps/portal/rta/ae/public-transport/timetable?lang=en",detail:"Confirm the bus route, stop and direction with RTA."},
    airport:{label:"Dubai RTA airport journey planning",href:RTA,detail:"Enter the airport terminal explicitly to compare public transport connections."},
  },
  "GB:london":{
    train:{label:"TfL rail journey planner",href:TFL,detail:"Compare suburban rail, London Overground and Elizabeth line connections."},
    metro:{label:"TfL Tube map",href:"https://content.tfl.gov.uk/standard-tube-map.pdf",detail:"Check interchanges and service status for the Underground."},
    bus:{label:"TfL bus network",href:"https://tfl.gov.uk/modes/buses/",detail:"Find routes, stops and live departures through the operator."},
    airport:{label:"TfL London airport travel guide",href:"https://tfl.gov.uk/help-with-travel/ways-to-travel/london-airports",detail:"Select the correct airport and terminal before comparing rail, Tube and bus options."},
  },
  "US:new-york":{
    train:{label:"MTA commuter rail routes",href:MTA,detail:"Choose Long Island Rail Road or Metro-North and check the departure station."},
    metro:{label:"MTA subway maps and schedules",href:"https://www.mta.info/maps",detail:"Check the service pattern and station accessibility."},
    bus:{label:"MTA Bus Time",href:"https://bustime.mta.info/",detail:"Look up your route or boarding stop."},
    airport:{label:"MTA LaGuardia bus information",href:"https://bustime.mta.info/?search=Q70",detail:"The Q70 connects LaGuardia with rail and subway interchanges. If using JFK, plan separately for the AirTrain connection."},
  },
};

export function transitOptions(city:MobilityCity) {
  const name=city.name.normalize("NFKC").toLowerCase().replace(/[\s]+/g,"-");
  const key=city.countryCode+":"+(name==="new-delhi"?"delhi":name==="bangalore"?"bengaluru":name==="new-york-city"?"new-york":name);
  return modes.map(([mode,label,term])=>{
    const source=citySources[key]?.[mode];
    if(source)return {mode,title:label,kind:"official" as const,...source};
    const query=new URLSearchParams({query:[term,city.name,city.country].filter(Boolean).join(", ")});
    return {mode,title:label,kind:"map" as const,label:"Search on OpenStreetMap",
      href:"https://www.openstreetmap.org/search?"+query,
      detail:"Explore mapped places and confirm local service with the operator."};
  });
}
