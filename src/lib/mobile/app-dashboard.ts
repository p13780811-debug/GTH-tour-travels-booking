export type AppPillar="all"|"travel"|"property"|"tender";
export const appServices=[
 {id:"flights",label:"Flights",href:"/app/flights",pillar:"travel",icon:"plane",keywords:"air airport airline tickets"},
 {id:"hotels",label:"Hotels",href:"/app/hotels",pillar:"travel",icon:"hotel",keywords:"stay rooms booking"},
 {id:"property",label:"Property",href:"/app/property",pillar:"property",icon:"building",keywords:"real estate registry projects home"},
 {id:"tenders",label:"Tenders",href:"/app/tenders",pillar:"tender",icon:"briefcase",keywords:"procurement opportunities bids"},
 {id:"transfers",label:"Airport transfers",href:"/transfers",pillar:"travel",icon:"transfer",keywords:"pickup drop taxi"},
 {id:"cars",label:"Car rentals",href:"/cars",pillar:"travel",icon:"car",keywords:"drive rental"},
 {id:"tours",label:"Tours & activities",href:"/tours",pillar:"travel",icon:"compass",keywords:"experience sightseeing tickets"},
 {id:"insurance",label:"Travel protection",href:"/insurance",pillar:"travel",icon:"shield",keywords:"insurance flight claims delay"},
 {id:"destinations",label:"Destinations",href:"/app/destinations",pillar:"travel",icon:"globe",keywords:"cities guides explore"},
 {id:"esim",label:"Travel eSIM",href:"/flights/out/yesim",pillar:"travel",icon:"sim",keywords:"data internet roaming connectivity"},
 {id:"saved-property",label:"Saved properties",href:"/real-estate/saved",pillar:"property",icon:"heart",keywords:"shortlist homes"},
 {id:"property-tools",label:"Property tools",href:"/real-estate/tools",pillar:"property",icon:"calculator",keywords:"emi repayment planning"},
 {id:"saved-tenders",label:"Saved tenders",href:"/tender/saved",pillar:"tender",icon:"bookmark",keywords:"shortlist watchlist"},
 {id:"tender-help",label:"Tender services",href:"/tender/services",pillar:"tender",icon:"file",keywords:"help assistance document quote"},
] as const;
export const appPromotions=[
 {id:"stay",pillar:"travel",eyebrow:"Plan your stay",title:"A new place. A better break.",description:"Find hotels, rooms and stay options worldwide.",action:"Find a stay",href:"/app/hotels",image:"/images/mega/hotels.jpg"},
 {id:"fly",pillar:"travel",eyebrow:"Your next journey",title:"Take your plans further.",description:"Search flights, then arrange your airport transfer.",action:"Search flights",href:"/app/flights",image:"/images/mega/flights.jpg"},
 {id:"property",pillar:"property",eyebrow:"Property discovery",title:"Explore your next move.",description:"Browse project records and view their source details.",action:"Explore properties",href:"/app/property",image:"/images/real-estate.jpg"},
 {id:"tender",pillar:"tender",eyebrow:"Business opportunities",title:"Find your next opportunity.",description:"Explore published tender notices and official documents.",action:"Explore tenders",href:"/app/tenders",image:"/images/tender.jpg"},
] as const;
export function filterAppServices(pillar:AppPillar,query:string){
 const needle=query.trim().toLocaleLowerCase().slice(0,70);
 return appServices.filter(service=>(pillar==="all"||service.pillar===pillar)&&(!needle||`${service.label} ${service.keywords}`.toLocaleLowerCase().includes(needle)));
}
