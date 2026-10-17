import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {guideBySlug,contentReady} from "@/lib/travel/guideCatalog";
import {publishedMedia,guideIsReadyForIndex} from "@/lib/travel/guideMedia";
import {listPlaces,type Place} from "@/lib/travel/osmAttractions";
import GuideDetail from "@/components/travel/GuideDetail";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params,guide=guideBySlug(slug);
 if(!guide)return {title:"Guide unavailable | GTH PRO",robots:{index:false,follow:false}};
 const media=await publishedMedia([slug]),image=media.get(slug),ready=contentReady(guide)&&guideIsReadyForIndex(slug,media);
 return {title:guide.title+" | GTH PRO",description:guide.summary,alternates:{canonical:"/guides/"+slug},
  robots:{index:ready,follow:true},openGraph:{title:guide.title,description:guide.summary,type:"article",
   ...(image?{images:[{url:image.image_url,alt:image.alt_text}]}:{})}};
}
export default async function GuidePage({params}:Props){
 const {slug}=await params,guide=guideBySlug(slug);if(!guide)notFound();
 const [media,source]=await Promise.all([publishedMedia([slug]),guide.city?
  listPlaces({country:guide.countryCode,city:guide.city,limit:6}).catch(()=>({items:[] as Place[]})):
  Promise.resolve({items:[] as Place[]})]);
 return <GuideDetail guide={guide} media={media.get(slug)||null}
   indexable={guideIsReadyForIndex(slug,media)} places={source.items}/>;
}
