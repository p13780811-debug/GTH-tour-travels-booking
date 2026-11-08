import {openBrowserAsync,WebBrowserPresentationStyle} from "expo-web-browser";
import {firstPartyUrl} from "./routing";

const LIVE_PAGES=new Set(["/","/mega-aggregator","/flights","/hotels","/tours","/activities","/real-estate","/tender","/destinations","/bus","/train","/ferry","/cruises","/transfers","/cars","/insurance","/guides","/blog","/travel/deals","/travel/airports","/privacy-policy","/terms-and-conditions","/contact"]);
/** A new navigation must request the current website HTML. Only known public
 * pages get a revision parameter; affiliate exits, API and signed URLs retain
 * every original byte of their destination and tracking parameters. */
export function liveWebsiteUrl(path:string,revision=Date.now()):string|null{
 const target=firstPartyUrl(path);
 if(!target)return null;
 const url=new URL(target);
 const publicDetail=/^\/(?:real-estate|tender|tours|hotels\/stay|destinations)\/[a-zA-Z0-9:.-]+$/.test(url.pathname);
 if(!url.search&&(LIVE_PAGES.has(url.pathname)||publicDetail)&&Number.isSafeInteger(revision)&&revision>=0)
  url.searchParams.set("gth_app_refresh",String(revision));
 return url.toString();
}
/** Free OS browser surfaces, not a second website or an app-owned checkout.
 * Website deployments immediately supply the live service UI on next open. */
export async function openLiveWebsite(path:string,theme:{bg:string;text:string}):Promise<void>{
 const target=liveWebsiteUrl(path);
 if(!target)throw Error("Unsupported website destination");
 const result=await openBrowserAsync(target,{
  toolbarColor:theme.bg,secondaryToolbarColor:theme.bg,controlsColor:theme.text,
  showTitle:true,enableBarCollapsing:true,createTask:false,showInRecents:false,
  dismissButtonStyle:"close",presentationStyle:WebBrowserPresentationStyle.FULL_SCREEN,
  windowFeatures:"noopener,noreferrer",
 });
 if(result.type==="locked")throw Error("A service is already open");
}
