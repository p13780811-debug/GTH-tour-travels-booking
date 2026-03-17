import dynamic from "next/dynamic"
import HeroSlider from "../HeroSlider"
import DestinationScroll from "../sections/DestinationScroll"
import GlassMenu from "../sections/GlassMenu"
import HeroSearch from "../sections/HeroSearch"

const HotelScroll = dynamic(() => import("../sections/HotelScroll"))
const ActivitiesGrid = dynamic(() => import("../sections/ActivitiesGrid"))
const TransfersSection = dynamic(() => import("../sections/TransfersSection"))
const GuidesScroll = dynamic(() => import("../sections/GuidesScroll"))
const AffiliateDeals = dynamic(() => import("../sections/AffiliateDeals"))

export default function TravelMasterTemplate() {
    return (

        <main className="w-full overflow">

            {/* HERO */}


            {/* HERO SEARCH */}
            <section>
                <HeroSearch />
            </section>

            {/* GLASS MENU */}
            <section>
                <GlassMenu />
            </section>

            {/* DESTINATIONS */}
            <section>
                <DestinationScroll />
            </section>

            {/* HOTEL DEALS */}
            <section>
                <HotelScroll />
            </section>

            {/* ACTIVITIES */}
            <section>
                <ActivitiesGrid />
            </section>

            {/* TRANSFERS */}
            <section>
                <TransfersSection />
            </section>

            {/* GUIDES */}
            <section>
                <GuidesScroll />
            </section>

            {/* AFFILIATE DEALS */}
            <section>
                <AffiliateDeals />
            </section>

        </main>

    )
}