import DiscoveryCardPhoto from "@/components/destination/DiscoveryCardPhoto";
import {marketplacePhoto} from "@/lib/mobile/marketplace-visuals";
export default function MarketplaceSectionPhoto({kind}:{kind:string}){
 return <div className="relative aspect-[21/8] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"><DiscoveryCardPhoto source={null} fallback={marketplacePhoto(kind)} title=""/></div>;
}
