import type {Metadata} from "next";
import MobilityView from "@/components/mobility/MobilityView";
import {MOBILITY_CITIES,mobilityCity} from "@/lib/mobility/city";
import {isPublicLaunch} from "@/lib/seo/site";

export const metadata:Metadata={
  title:"Local Transport & Driver Hisaab Diary | GTH PRO",
  description:"Find local train, metro, bus and airport transport sources. Calculate driver earnings and fuel costs and keep a free diary in your browser.",
  alternates:{canonical:"/mobility"},
  robots:{index:isPublicLaunch(),follow:true},
};

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};

export default async function MobilityPage({searchParams}:Props){
  const query=await searchParams;
  const city=mobilityCity({name:query.city,slug:query.slug,country:query.country,countryCode:query.cc})??MOBILITY_CITIES[0];
  return <MobilityView city={city}/>;
}
