import Link from "next/link";
import {known} from "@/lib/real-estate/explorer";
import {officialMahaReraUrl} from "./explorer-presentation";

export type ReraProjectRow={
 slug:string;title:string;rera_id?:string|null;developer?:string|null;
 builder_name?:string|null;city?:string|null;district?:string|null;
 completion_date?:string|null;official_source_url?:string|null;
};

export default function RegistryTable({rows,caption="Recorded MahaRERA projects"}:{
 rows:readonly ReraProjectRow[];caption?:string
}){
 if(!rows.length)return <p className="text-sm text-[var(--text-soft)]">No source-backed project records are available for this search. Broaden the search or check the official MahaRERA portal.</p>;
 return <div className="min-w-0 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
  <table className="w-full min-w-[690px] text-left text-xs sm:text-sm">
   <caption className="sr-only">{caption}</caption>
   <thead className="border-b border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text)]">
    <tr><th scope="col" className="p-3 font-semibold">Project</th><th scope="col" className="p-3 font-semibold">MahaRERA reference</th><th scope="col" className="p-3 font-semibold">Developer / location</th><th scope="col" className="p-3 font-semibold">Recorded timeline</th><th scope="col" className="p-3 font-semibold">Official source</th></tr>
   </thead>
   <tbody className="divide-y divide-[var(--border)]">
    {rows.map(p=>{
     const source=officialMahaReraUrl(p.official_source_url);
     // Never infer on-time, delayed, completed or under-construction status from
     // an imported date. Only official source / project updates can confirm it.
     const timeline=typeof p.completion_date==="string"&&/^\d{4}-\d{2}-\d{2}/.test(p.completion_date)
       ?p.completion_date.slice(0,10):"Not recorded";
     return <tr key={p.slug} className="align-top hover:bg-[var(--bg-soft)]">
      <td className="p-3 font-medium"><Link href={"/real-estate/"+encodeURIComponent(p.slug)} className="underline-offset-2 hover:underline">{p.title}</Link></td>
      <td className="p-3 font-mono">{p.rera_id||"Not recorded"}</td>
      <td className="p-3">{known(p.developer)||known(p.builder_name)||"Developer not recorded"}<span className="mt-1 block text-[var(--text-soft)]">{[known(p.city),known(p.district)].filter(Boolean).join(" · ")||"Location not recorded"}</span></td>
      <td className="p-3"><span>{timeline}</span><span className="mt-1 block text-[11px] text-[var(--text-soft)]">Recorded date; no delay verdict</span></td>
      <td className="p-3">{source?<a href={source} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">MahaRERA record</a>:<span className="text-[var(--text-soft)]">Not linked</span>}</td>
     </tr>
    })}
   </tbody>
  </table>
 </div>;
}
