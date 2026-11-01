import type {Metadata} from "next";
import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MobileResearchDesk from "@/components/mobile/MobileResearchDesk";

export const metadata:Metadata={title:"My Research Desk | GTH PRO App",
 description:"Your device-only saved destination, hotel, property and tender shortcuts.",
 robots:{index:false,follow:false}};
export default function AppResearchBoard(){
 return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(96px+env(safe-area-inset-bottom))] text-[var(--text)]">
  <MobileAppHeader/>
  <MobileResearchDesk/>
 </main>;
}
