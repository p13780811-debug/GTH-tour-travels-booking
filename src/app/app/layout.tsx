import AppServiceUsage from "@/components/mobile/AppServiceUsage";
import type {Metadata} from "next";
export const metadata:Metadata={
 manifest:"/manifest.webmanifest",
 appleWebApp:{capable:true,title:"GTH PRO",statusBarStyle:"default"},
 icons:{icon:[{url:"/app-brand/icon-192.png",sizes:"192x192",type:"image/png"}],apple:[{url:"/app-brand/icon-180.png",sizes:"180x180",type:"image/png"}]},
 robots:{index:false,follow:false}
};
export default function AppLayout({children}:{children:React.ReactNode}){return <><AppServiceUsage/>{children}</>;}
