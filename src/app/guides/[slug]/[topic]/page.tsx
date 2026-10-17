import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {topicBySlugs} from "@/lib/travel/guideCatalog";
import {publishedMedia,guideIsReadyForIndex} from "@/lib/travel/guideMedia";
import GuideDetail from "@/components/travel/GuideDetail";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string;topic:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug,topic}=await params;const guide=topicBySlugs(slug,topic);
 if(!guide)return {title:"Guide unavailable | GTH PRO",robots:{index:false,follow:false}};
 const media=await publishedMedia([guide.slug]),image=media.get(guide.slug);
 return {title:guide.title+" | GTH PRO",description:guide.summary,alternates:{canonical:"/guides/"+guide.slug},
 robots:{index:guideIsReadyForIndex(guide.slug,media),follow:true},
 ...(image?{openGraph:{title:guide.title,description:guide.summary,images:[{url:image.image_url,alt:image.alt_text}]}}:{})};
}
export default async function GuideTopicPage({params}:Props){
 const {slug,topic}=await params;const guide=topicBySlugs(slug,topic);if(!guide)notFound();
 const media=await publishedMedia([guide.slug]);
 return <GuideDetail guide={guide} media={media.get(guide.slug)||null} indexable={guideIsReadyForIndex(guide.slug,media)}/>;
}
