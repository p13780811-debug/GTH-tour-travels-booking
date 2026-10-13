"use client";

import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import ChatBot from "./ChatBot";
import EcosystemFooter from "./sections/EcosystemFooter";

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // ✅ Real estate detection
    const isRealEstate = pathname?.startsWith("/real-estate");
    const isFlagship = pathname === "/";

    return (
        <>
            {/* ✅ CONTENT */}
            <div className={`min-h-screen ${isRealEstate || isFlagship ? 'pb-0' : 'pb-24 md:pb-0'}`}>
                {children}
            </div>

            {/* ❌ REAL ESTATE → NO global UI */}
            {!isRealEstate && !isFlagship && (
                <>
                    <MobileNav />
                    <ChatBot />
                    <EcosystemFooter />
                </>
            )}
        </>
    );
}