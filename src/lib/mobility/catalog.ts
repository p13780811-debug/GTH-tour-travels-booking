import "server-only";
import {cache} from "react";
import {unstable_cache} from "next/cache";
import {supabase} from "@/lib/supabase";
import {countryCodeForDestinationName} from "@/lib/travel/osmCountryCodes";
import {MOBILITY_CITIES,mobilityCity,validMobilitySlug} from "./city";

const findCatalogCity=unstable_cache(async (slug:string)=>{
  const {data,error}=await supabase.from("destinations").select("slug,name,country,country_code")
    .eq("slug",slug).is("is_active",true).limit(1).abortSignal(AbortSignal.timeout(4500)).maybeSingle();
  if(error)throw new Error("Mobility catalog unavailable");
  if(!data)return null;
  return mobilityCity({name:data.name,slug:data.slug,country:data.country,
    countryCode:data.country_code??countryCodeForDestinationName(data.country)});
},["mobility-catalog-city-v1"],{revalidate:3600,tags:["public-destination-catalog"]});

export const getMobilityCity=cache(async(slug:string)=>{
  if(!validMobilitySlug(slug))return null;
  return MOBILITY_CITIES.find(city=>city.slug===slug)??await findCatalogCity(slug);
});
