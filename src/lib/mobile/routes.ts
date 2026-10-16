/** Routes intentionally contained in the installable app shell.
 * Desktop and mobile website pages keep their existing independent URLs/UI.
 */
export function mobileAppHref(href: string): string {
  const [path,query=""]=href.split("?",2);
  const suffix=query?"?"+query:"";
  if(path==="/app"||path.startsWith("/app/"))return href;
  const exact:Record<string,string>={
    "/flights":"/app/flights","/hotels":"/app/hotels",
    "/real-estate":"/app/property","/tender":"/app/tenders",
    "/destinations":"/app/destinations","/travel":"/app",
  };
  if(exact[path])return exact[path]+suffix;
  const patterns:Array<[RegExp,(part:string)=>string]>=[
    [/^\/destinations\/([a-z0-9-]{2,80})$/,id=>"/app/destinations/"+id],
    [/^\/hotels\/stay\/(osm:(?:node|way|relation)-[0-9]{1,19}|[0-9a-f-]{36})$/i,id=>"/app/hotels/"+id],
    [/^\/real-estate\/([a-z0-9-]{2,128})$/,id=>"/app/property/"+id],
    [/^\/tender\/([0-9a-f-]{36})$/i,id=>"/app/tenders/"+id],
  ];
  for(const [regex,mapping] of patterns){
    const match=path.match(regex);
    if(match)return mapping(match[1])+suffix;
  }
  return href;
}
export type MobileSection="flights"|"hotels"|"property"|"tenders"|"destinations";
export const MOBILE_SECTIONS=["flights","hotels","property","tenders","destinations"] as const;
export function isMobileSection(value:string):value is MobileSection{
  return MOBILE_SECTIONS.some(section=>section===value);
}
