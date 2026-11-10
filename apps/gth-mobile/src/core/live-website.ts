import {openBrowserAsync,WebBrowserPresentationStyle} from "expo-web-browser";
import {firstPartyUrl} from "./routing";

/** Free OS browser surfaces, not a second website or an app-owned checkout.
 * Canonical URLs let the browser and website reuse their normal cache. */
export async function openLiveWebsite(path:string,theme:{bg:string;text:string}):Promise<void>{
 const target=firstPartyUrl(path);
 if(!target)throw Error("Unsupported website destination");
 const result=await openBrowserAsync(target,{
  toolbarColor:theme.bg,secondaryToolbarColor:theme.bg,controlsColor:theme.text,
  showTitle:true,enableBarCollapsing:true,createTask:false,showInRecents:false,
  dismissButtonStyle:"close",presentationStyle:WebBrowserPresentationStyle.FULL_SCREEN,
  windowFeatures:"noopener,noreferrer",
 });
 if(result.type==="locked")throw Error("A service is already open");
}
