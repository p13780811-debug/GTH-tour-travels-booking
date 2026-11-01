import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {resolveUniversalTarget} from "@/lib/mobile/universal-search";

export const dynamic="force-dynamic";
export const metadata:Metadata={
 title:"Universal Search | GTH PRO App",
 description:"Routes existing GTH PRO search requests to the corresponding working service.",
 robots:{index:false,follow:false},
};
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};

/** A single safe entry point, not another hotel / property / tender index. */
export default async function AppUniversalSearch({searchParams}:Props){
 const params=await searchParams;
 const target=resolveUniversalTarget(params.q,params.category);
 redirect(target.href);
}
