import type { TenderFilters } from "./catalog";

type LinkFilters = Pick<TenderFilters, "q"|"country"|"sector"|"scope"|"closingBefore"|"closingWithin">;
export function tenderFilterHref(filters: LinkFilters, language:string, page=1):string {
  const qs=new URLSearchParams();
  if(filters.q)qs.set("q",filters.q);
  if(filters.country)qs.set("country",filters.country);
  if(filters.sector)qs.set("sector",filters.sector);
  if(filters.scope)qs.set("scope",filters.scope);
  if(filters.closingBefore)qs.set("closingBefore",filters.closingBefore);
  if(filters.closingWithin)qs.set("closingWithin",filters.closingWithin);
  if(language)qs.set("lang",language);
  if(page>1)qs.set("page",String(page));
  const encoded=qs.toString();
  return "/tender"+(encoded?"?"+encoded:"");
}
