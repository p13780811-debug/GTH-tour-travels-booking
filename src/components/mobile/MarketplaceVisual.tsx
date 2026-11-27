import Image from "next/image";
import {marketplacePhoto} from "@/lib/mobile/marketplace-media";
export default function MarketplaceVisual({media,priority=false,compact=false}:{media:string;priority?:boolean;compact?:boolean}){
 return <div data-marketplace-visual className={"relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] "+(compact?"aspect-[16/8]":"aspect-[16/7]")}>
  <Image src={marketplacePhoto(media)} alt="" fill sizes={compact?"(max-width:640px) 46vw,300px":"(max-width:640px) 100vw,900px"} priority={priority} className="object-cover"/>
  <span className="absolute bottom-2 left-2 rounded-md bg-[var(--bg)] px-2 py-1 text-[10px] font-medium text-[var(--text)]">Illustrative visual</span>
 </div>;
}
