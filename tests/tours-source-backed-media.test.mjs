import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {safeLicensedPlacePhoto} from "../src/lib/travel/commons-place-media.ts";
import {directExperienceSearch} from "../src/lib/tours/discovery.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("obsolete synthetic importer is removed",()=>{
  assert.throws(()=>read("backend/import_activities_tours.py"));
});
test("exact matching requires secure Commons identity and full media rights",()=>{
  const info={thumburl:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Example.jpg/960px-Example.jpg",
    descriptionurl:"https://commons.wikimedia.org/wiki/File:Example.jpg",width:1200,height:800,
    extmetadata:{LicenseShortName:{value:"CC BY 4.0"},
      LicenseUrl:{value:"https://creativecommons.org/licenses/by/4.0/"},
      Attribution:{value:"Source Photographer"}}};
  const photo=safeLicensedPlacePhoto(info);
  assert.equal(photo?.author,"Source Photographer");
  assert.equal(photo?.license,"CC BY 4.0");
  assert.equal(safeLicensedPlacePhoto({...info,thumburl:"https://images.pexels.com/photos/xyz.jpg"}),null);
  assert.equal(safeLicensedPlacePhoto({...info,extmetadata:{...info.extmetadata,LicenseShortName:{value:"All rights reserved"}}}),null);
  assert.equal(safeLicensedPlacePhoto({...info,width:200}),null);
  assert.equal(safeLicensedPlacePhoto({...info,extmetadata:{...info.extmetadata,Restrictions:{value:"Restricted"}}}),null);
});
test("related experience searches preserve place identity without calling it exact booking",()=>{
  const link=directExperienceSearch("Eiffel Tower","Paris");
  const u=new URL(link);
  assert.equal(u.origin,"https://www.klook.com");
  assert.equal(u.pathname,"/en-IN/search/result/");
  assert.equal(u.searchParams.get("query"),"Eiffel Tower Paris");
  assert.equal(directExperienceSearch("https://evil.example/?x=1","Paris"),null);
  assert.equal(directExperienceSearch("X".repeat(200),"Paris"),null);
});
test("source rail uses public OSM identity and only exact Commons source photos",()=>{
  const card=read("src/components/tours/SourceMappedExperiences.tsx");
  assert.match(card,/gth_osm_attractions/);
  assert.match(card,/eq\("is_public",true\)/);
  assert.match(card,/wikidata_qid/);
  assert.match(card,/licensedCommonsPhotos/);
  assert.match(card,/Original OpenStreetMap record/);
  assert.match(card,/not bookable tours/i);
  assert.doesNotMatch(card,/Math\.random|guaranteed booking|fake price/i);
  const layout=read("src/components/tours/TourLanding.tsx");
  assert.match(layout,/<SourceMappedExperiences city=\{filters\.city\} basePath=\{basePath\}/);
  const listings=read("src/lib/tours.ts");
  assert.match(listings,/eq\("is_public", true\)\.eq\("media_rights_verified", true\)/);
});

test("individual tour booking never points to generic partner homepage or mismatched item",async()=>{
  const {verifiedTourProductHandoff}=await import("../src/lib/tours/product-handoff.ts");
  const source="https://www.klook.com/en-IN/activity/12345-paris-eiffel-tower/";
  assert.equal(verifiedTourProductHandoff(source,source),source);
  assert.equal(verifiedTourProductHandoff("https://klook.tpo.lv/IKb6eSUe",source),null);
  assert.equal(verifiedTourProductHandoff("https://www.klook.com/",source),null);
  assert.equal(verifiedTourProductHandoff("https://www.klook.com/en-IN/activity/54321-other/",source),null);
  assert.equal(verifiedTourProductHandoff("https://tp.media/r?marker=417668",source),null);
  const tracked="https://tp.media/r?marker=417668&u="+encodeURIComponent(source);
  assert.equal(verifiedTourProductHandoff(tracked,source),tracked);
  assert.equal(verifiedTourProductHandoff(tracked,null),null);
  const detail=read("src/app/tours/[slug]/page.tsx");
  assert.match(detail,/publicPartnerLink\(tour\.affiliate_link, tour\.source_url\)/);
});
