import MobileAppHeader from "@/components/mobile/MobileAppHeader";
import MarketplaceHome from "@/components/mobile/MarketplaceHome";
import MarketplaceVisual from "@/components/mobile/MarketplaceVisual";
export default function AppTravel(){return <main className="min-h-dvh min-w-0 overflow-x-clip bg-[var(--bg)] pb-[calc(94px+env(safe-area-inset-bottom))] text-[var(--text)]"><MobileAppHeader/><section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6"><MarketplaceVisual media="travel" priority/><h1 className="mt-4 text-2xl font-bold">Travel marketplace</h1><p className="mt-2 text-sm text-[var(--text-soft)]">Choose your journey and continue to the existing specialist booking services.</p></section><MarketplaceHome/></main>;}
