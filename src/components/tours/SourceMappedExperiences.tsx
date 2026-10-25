import Link from "next/link";
import {createClient} from "@supabase/supabase-js";
import {ArrowUpRight, Compass, ImageOff, MapPin, ShieldCheck} from "lucide-react";
import TourCarousel from "./TourCarousel";
import TourImage from "./TourImage";
import {directExperienceSearch, type ExperiencePath} from "@/lib/tours/discovery";
import {licensedCommonsPhotos} from "@/lib/travel/commons-place-media";

type Place = {
  source_id:string; name:string; category:string; city:string|null;
  country_name:string|null; source_url:string; wikidata_qid:string;
};
const ID = /^(node|way|relation)\/[1-9][0-9]{0,18}$/;
const QID = /^Q[1-9][0-9]{0,14}$/;

/**
 * Source-backed PLACE discovery when supplier tour inventory is unpublished.
 * No synthetic tickets, tour operators, prices or misleading exact-booking CTAs.
 * The only image is the exact Wikidata QID's licensed Wikimedia P18 photograph.
 */
export default async function SourceMappedExperiences({city,basePath}:{
  city:string; basePath:ExperiencePath;
}) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const validCity=city && /^[\p{L}\p{M}\p{N} .'-]{1,70}$/u.test(city);
  let query=db.from("gth_osm_attractions")
    .select("source_id,name,category,city,country_name,source_url,wikidata_qid")
    .eq("is_public",true).eq("is_community_directory",true)
    .not("wikidata_qid","is",null)
    .in("category",["attraction","museum","fort","castle","monument","beach","theme-park"])
    .order("source_id",{ascending:true}).limit(16);
  if(validCity)query=query.ilike("city",city);
  const {data,error}=await query;
  if(error||!data?.length)return null;
  const places=(data as Place[]).filter(p=>ID.test(p.source_id)&&QID.test(p.wikidata_qid)&&
    p.source_url==="https://www.openstreetmap.org/"+p.source_id &&
    typeof p.name==="string"&&p.name.trim().length>=3&&p.name.length<=180);
  if(!places.length)return null;
  const photos=await licensedCommonsPhotos(places.map(place=>place.wikidata_qid));
  const sectionTitle=basePath==="/activities"?"Discover real attractions & places":"Discover places worth exploring";
  return <section aria-label="Verified source-mapped place discovery"
    className="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
          <ShieldCheck size={15}/> OpenStreetMap + exact Wikidata photo matching
        </p>
        <h2 className="mt-2 text-xl font-bold sm:text-2xl">{sectionTitle}</h2>
        <p className="mt-2 max-w-3xl text-xs leading-6 text-[var(--text-soft)]">
          These are genuine community-mapped places, not bookable tours. Photographs appear only when
          Wikimedia provides a matching identity, license, author and source. Supplier search links show related results, not guaranteed exact products.
        </p>
      </div>
      <Link href="/attractions" className="text-xs font-semibold underline">Browse real places <ArrowUpRight size={13} className="inline"/></Link>
    </div>
    <TourCarousel label="Source-linked places and attributed photographs">
      {places.map(place=>{
        const photo=photos.get(place.wikidata_qid);
        const search=directExperienceSearch(place.name,place.city||city);
        return <article key={place.source_id}
          className="flex w-[205px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--text)] sm:w-[230px]">
          <div className="relative h-[126px] w-full shrink-0 overflow-hidden bg-[var(--bg-soft)] sm:h-[144px]">
            {photo?<TourImage src={photo.url} title={place.name+" — source-linked Commons photograph"}
              className="h-full w-full object-cover"/>:
              <div role="img" aria-label={"No licensed exact photo for "+place.name}
                className="flex h-full flex-col items-center justify-center gap-2 text-xs text-[var(--text-soft)]">
                <ImageOff size={24}/> Exact photo pending
              </div>}
            <span className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] capitalize text-white">{place.category.replaceAll("-"," ")}</span>
          </div>
          <div className="flex min-h-[164px] flex-1 flex-col p-3">
            <h3 className="line-clamp-2 text-sm font-bold">{place.name}</h3>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--text-soft)]">
              <MapPin size={13}/>{[place.city,place.country_name].filter(Boolean).join(", ")||"Source-linked place"}
            </p>
            {photo&&<p className="mt-2 line-clamp-1 text-[10px] text-[var(--text-soft)]">
              <a href={photo.page} target="_blank" rel="noopener noreferrer nofollow" className="underline">{photo.author}</a>
              {" · "}<a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">{photo.license}</a>
            </p>}
            <div className="mt-auto flex flex-col gap-2 pt-3 text-[11px]">
              {search&&<a href={search} rel="noopener noreferrer sponsored" target="_blank"
                className="gth-btn-gold inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-center font-semibold">
                <Compass size={13}/> Find related experiences <ArrowUpRight size={13}/>
              </a>}
              <a href={place.source_url} target="_blank" rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 font-medium underline">
                Original OpenStreetMap record <ArrowUpRight size={12}/>
              </a>
            </div>
          </div>
        </article>;
      })}
    </TourCarousel>
  </section>;
}
