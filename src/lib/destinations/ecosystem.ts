/** Canonical worldwide GTH PRO service navigation.
 * Only include real routes; city filters are used only when the receiving route supports them.
 * This file is a directory of discovery actions, not an inventory count or booking guarantee.
 */
export type DestinationService = {
  key:string;
  label:string;
  description:string;
  href:string;
  scope:"destination"|"country"|"global";
  pillar:"Travel"|"Real Estate"|"Tenders";
};
const ISO:Readonly<Record<string,string>>={
 "India":"IN","United Arab Emirates":"AE","France":"FR","Indonesia":"ID","Thailand":"TH",
 "Singapore":"SG","Japan":"JP","United Kingdom":"GB","United States":"US",
 "Maldives":"MV","Sri Lanka":"LK","China":"CN","Hungary":"HU","South Africa":"ZA",
 "Denmark":"DK","Ireland":"IE","Switzerland":"CH","Vietnam":"VN","Finland":"FI",
 "South Korea":"KR","Taiwan":"TW","Netherlands":"NL","Spain":"ES","Greece":"GR",
 "Poland":"PL","Canada":"CA","Nepal":"NP","Malaysia":"MY","Philippines":"PH",
 "Norway":"NO","Portugal":"PT","Czechia":"CZ","Austria":"AT","Sweden":"SE","Italy":"IT"
};
export function destinationServices(place:{slug:string;name:string;country:string|null}):DestinationService[]{
 const slug=encodeURIComponent(place.slug);
 const country=place.country ? ISO[place.country] : undefined;
 const realEstate=new URLSearchParams({city:place.name});
 if(place.country)realEstate.set("country",place.country);
 const tender=new URLSearchParams({scope:"world"});
 if(country)tender.set("country",country);
 return [
  {key:"hotels",label:"Hotels & stays",description:"Search public hotel listings",href:"/hotels?destination="+slug,scope:"destination",pillar:"Travel"},
  {key:"flights",label:"Flights",description:"Compare routes and dates",href:"/flights",scope:"global",pillar:"Travel"},
  {key:"tours",label:"Tours",description:"Explore listed local tours",href:"/tours?city="+slug,scope:"destination",pillar:"Travel"},
  {key:"activities",label:"Activities",description:"Discover local experiences",href:"/activities?city="+slug,scope:"destination",pillar:"Travel"},
  {key:"transfers",label:"Airport transfers",description:"Check pickup providers",href:"/transfers",scope:"global",pillar:"Travel"},
  {key:"cars",label:"Car rentals",description:"Browse rental providers",href:"/cars",scope:"global",pillar:"Travel"},
  {key:"bus",label:"Buses",description:"Explore bus options",href:"/bus",scope:"global",pillar:"Travel"},
  {key:"train",label:"Trains",description:"Explore rail connections",href:"/train",scope:"global",pillar:"Travel"},
  {key:"guides",label:"Travel guides",description:"Read trip-planning guides",href:"/guides",scope:"global",pillar:"Travel"},
  {key:"blog",label:"Travel stories",description:"Discover travel knowledge",href:"/blog",scope:"global",pillar:"Travel"},
  {key:"properties",label:"Real Estate",description:"Find listed properties",href:"/real-estate?"+realEstate.toString(),scope:"destination",pillar:"Real Estate"},
  {key:"post-property",label:"List a property",description:"Owner property submission",href:"/real-estate/post-property",scope:"global",pillar:"Real Estate"},
  {key:"tenders",label:"Global tenders",description:country?"Discover country opportunities":"Search published opportunities",href:"/tender?"+tender.toString(),scope:country?"country":"global",pillar:"Tenders"},
  {key:"tender-assistant",label:"Tender assistant",description:"Explore eligibility guidance",href:"/tender/assistant",scope:"global",pillar:"Tenders"},
  {key:"list-hotel",label:"List your hotel",description:"Owner hotel submissions",href:"/hotels/list-your-property",scope:"global",pillar:"Travel"},
 ];
}
export function destinationScopeLabel(scope:DestinationService["scope"],name:string,country:string|null){
 return scope==="destination" ? "For "+name : scope==="country" && country ? "Across "+country : "Worldwide service";
}
