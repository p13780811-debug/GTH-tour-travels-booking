/** Approved or official public destination registry for stadium ticket discovery.
 * Public links only; never imply that inventory, availability or prices are synchronized.
 * Affiliate replacement belongs in a separate approved-provider resolver.
 */
export type TicketDestination={
 id:string;name:string;region:string;sport:string;url:string;
 kind:"official-tickets"|"official-schedule"|"authorized-marketplace";
};
export const ticketDestinations:readonly TicketDestination[]=[
 {id:"fifa",name:"FIFA tournament tickets",region:"Worldwide",sport:"Football",url:"https://www.fifa.com/tickets",kind:"official-tickets"},
 {id:"uefa",name:"UEFA tournament tickets",region:"Europe",sport:"Football",url:"https://www.uefa.com/tickets/",kind:"official-tickets"},
 {id:"nba",name:"NBA official tickets",region:"USA / Canada",sport:"Basketball",url:"https://nbatickets.nba.com/",kind:"official-tickets"},
 {id:"mlb",name:"MLB tickets",region:"USA / Canada",sport:"Baseball",url:"https://www.mlb.com/tickets",kind:"official-tickets"},
 {id:"nfl",name:"NFL tickets",region:"USA",sport:"American football",url:"https://www.nfl.com/tickets/",kind:"official-tickets"},
 {id:"nhl",name:"NHL tickets",region:"USA / Canada",sport:"Ice hockey",url:"https://www.nhl.com/tickets",kind:"official-tickets"},
 {id:"f1",name:"Formula 1 tickets",region:"Worldwide",sport:"Motorsport",url:"https://tickets.formula1.com/",kind:"official-tickets"},
 {id:"motogp",name:"MotoGP tickets",region:"Worldwide",sport:"Motorsport",url:"https://tickets.motogp.com/",kind:"official-tickets"},
 {id:"wimbledon",name:"Wimbledon tickets",region:"United Kingdom",sport:"Tennis",url:"https://www.wimbledon.com/en_GB/tickets/index.html",kind:"official-tickets"},
 {id:"usopen",name:"US Open Tennis tickets",region:"USA",sport:"Tennis",url:"https://www.usopen.org/en_US/tickets/index.html",kind:"official-tickets"},
 {id:"ausopen",name:"Australian Open tickets",region:"Australia",sport:"Tennis",url:"https://ausopen.com/tickets",kind:"official-tickets"},
 {id:"roland",name:"Roland-Garros tickets",region:"France",sport:"Tennis",url:"https://tickets.rolandgarros.com/",kind:"official-tickets"},
 {id:"ipl",name:"IPL official competition",region:"India",sport:"Cricket",url:"https://www.iplt20.com/",kind:"official-schedule"},
 {id:"icc",name:"ICC official events",region:"Worldwide",sport:"Cricket",url:"https://www.icc-cricket.com/",kind:"official-schedule"},
 {id:"bcci",name:"BCCI cricket fixtures",region:"India",sport:"Cricket",url:"https://www.bcci.tv/",kind:"official-schedule"},
 {id:"premier",name:"Premier League fixtures",region:"United Kingdom",sport:"Football",url:"https://www.premierleague.com/",kind:"official-schedule"},
 {id:"laliga",name:"LaLiga fixtures",region:"Spain",sport:"Football",url:"https://www.laliga.com/en-GB",kind:"official-schedule"},
 {id:"bundesliga",name:"Bundesliga fixtures",region:"Germany",sport:"Football",url:"https://www.bundesliga.com/en/bundesliga",kind:"official-schedule"},
 {id:"seriea",name:"Serie A fixtures",region:"Italy",sport:"Football",url:"https://www.legaseriea.it/en",kind:"official-schedule"},
 {id:"ligue1",name:"Ligue 1 fixtures",region:"France",sport:"Football",url:"https://ligue1.com/",kind:"official-schedule"},
 {id:"mls",name:"MLS tickets and fixtures",region:"USA / Canada",sport:"Football",url:"https://www.mlssoccer.com/",kind:"official-schedule"},
 {id:"afl",name:"AFL fixtures",region:"Australia",sport:"Australian rules",url:"https://www.afl.com.au/fixture",kind:"official-schedule"},
 {id:"cricketaus",name:"Cricket Australia",region:"Australia",sport:"Cricket",url:"https://www.cricket.com.au/",kind:"official-schedule"},
 {id:"npb",name:"Japan professional baseball",region:"Japan",sport:"Baseball",url:"https://npb.jp/eng/",kind:"official-schedule"},
 {id:"ticketmaster",name:"Ticketmaster sports tickets",region:"Multiple markets",sport:"Multi-sport",url:"https://www.ticketmaster.com/sports",kind:"authorized-marketplace"},
] as const;
export function validTicketDestination(url:string):boolean{
 try {const u=new URL(url);return u.protocol==="https:"&&!u.username&&!u.password&&!u.hash;}catch{return false;}
}
