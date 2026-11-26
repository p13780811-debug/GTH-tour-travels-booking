// Run from the repository root after copying the supplied WebP files into public/images/luxury.
// Does not fetch, write secrets, or accept arbitrary paths. Fail closed if any asset is missing.
import {readFileSync,writeFileSync,statSync} from "node:fs";
const ids=["hero","hotels","flights","tickets","packages","melbourne","mumbai","tokyo","london"];
const manifest={};
for(const id of ids){
 const path="/images/luxury/"+id+".webp",file="public"+path;
 const bytes=readFileSync(file);
 if(bytes.subarray(0,4).toString()!=="RIFF"||bytes.subarray(8,12).toString()!=="WEBP"||statSync(file).size>250000)throw Error("Invalid or oversized media: "+id);
 manifest[id]=path;
}
writeFileSync("src/lib/mobile/marketplace-generated-media.json",JSON.stringify(manifest,null,2)+"\n");
console.log("Generated marketplace media manifest ready; commit the image files and manifest together.");
