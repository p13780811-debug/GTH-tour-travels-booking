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
    const isAppHome = pathname === "/app" || Boolean(pathname?.startsWith("/app/"));

    return (
        <>
            {/* React 19 hoists this static ownership meta tag to document head.
                Keep RootLayout JSX byte-identical for Real Estate protection. */}
            <meta name="impact-site-verification" {...{value:"94cbf0e7-14b4-445d-94c5-8edd0ef466a2"}} />
            {/* ✅ CONTENT */}
            <div className={`min-h-screen ${isRealEstate || isFlagship || isAppHome ? 'pb-0' : 'pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-0'}`}>
                {children}
            </div>

            {/* ❌ REAL ESTATE → NO global UI */}
            {!isRealEstate && !isFlagship && <MobileNav />}
            {!isRealEstate && !isFlagship && !isAppHome && (
                <>
                    <ChatBot />
                    <EcosystemFooter />
                </>
            )}
        </>
    );
}