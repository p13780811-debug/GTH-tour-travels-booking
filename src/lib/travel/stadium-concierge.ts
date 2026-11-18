import type {Stadium} from "./stadiums";
export const venueLocations:Record<string,{lat:number;lng:number;transit:string}>={
 "lords-cricket-ground":{lat:51.5294,lng:-0.1727,transit:"St John's Wood station, then follow MCC event-day gate and accessibility guidance."},
 "eden-gardens":{lat:22.5646,lng:88.3433,transit:"Esplanade / Chandni Chowk Metro; check event-day gate notices."},
 "wankhede-stadium":{lat:18.9389,lng:72.8258,transit:"Churchgate railway station; follow your ticket's gate instructions."},
 "narendra-modi-stadium":{lat:23.0917,lng:72.5975,transit:"Motera Stadium Metro; check event-specific access."},
 "wembley-stadium":{lat:51.5560,lng:-0.2796,transit:"Wembley Park station; follow designated event walking routes."},
 "camp-nou":{lat:41.3809,lng:2.1228,transit:"Collblanc Metro; confirm the actual match venue before travelling."},
 "old-trafford":{lat:53.4631,lng:-2.2913,transit:"Old Trafford tram stop; allow extra time after events."},
 "melbourne-cricket-ground":{lat:-37.8200,lng:144.9834,transit:"Jolimont / Richmond stations; check event-day arrangements."},
 "yankee-stadium":{lat:40.8296,lng:-73.9262,transit:"161 St–Yankee Stadium subway; check game-day exit notices."},
 "singapore-national-stadium":{lat:1.3040,lng:103.8748,transit:"Stadium MRT station; follow event-specific entry directions."},
 "tokyo-dome":{lat:35.7056,lng:139.7519,transit:"Korakuen / Suidobashi stations; verify gate on ticket."},
 "wimbledon-centre-court":{lat:51.4337,lng:-0.2141,transit:"Southfields or Wimbledon stations; verify Championship-day shuttle and entry routes."},
 "arthur-ashe-stadium":{lat:40.7499,lng:-73.8477,transit:"Mets–Willets Point station; check official US Open entrance notices."},
 "madison-square-garden":{lat:40.7505,lng:-73.9934,transit:"Penn Station directly beneath the arena; follow event-specific entrance instructions."},
 "silverstone":{lat:52.0786,lng:-1.0169,transit:"No adjacent metro; check the circuit's event shuttle and parking plans."}
};
export function haversineKm(a:{lat:number;lng:number},b:{lat:number;lng:number}) {
 const rad=Math.PI/180, dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
export function safeHotelHandoff(venue:Pick<Stadium,"city"|"countryCode"|"slug">):string {
 const custom=process.env.NEXT_PUBLIC_NUITEE_WHITE_LABEL_URL;
 let base="https://gthproglobal.nuitee.link/";
 if(custom){try{const u=new URL(custom);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!u.hash&&u.hostname.endsWith(".nuitee.link"))base=u.origin+"/";}catch{/* safe fallback */}}
 const u=new URL(base);
 u.searchParams.set("city",venue.city.slice(0,80));u.searchParams.set("country",venue.countryCode);
 const geo=venueLocations[venue.slug];
 if(geo){u.searchParams.set("latitude",String(geo.lat));u.searchParams.set("longitude",String(geo.lng));}
 return u.toString();
}
