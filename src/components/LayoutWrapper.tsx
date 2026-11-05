"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
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
    const previousAppMode = useRef<boolean | null>(null);
    useEffect(() => {
        const previous = previousAppMode.current;
        previousAppMode.current = isAppHome;
        // Root's third-party script is chosen once per document. A full
        // navigation only when crossing the app/site boundary prevents
        // stale affiliate popups inside app mode and restores Drive on the
        // website. Internal app navigation remains an uninterrupted SPA.
        if (previous !== null && previous !== isAppHome) window.location.reload();
    }, [isAppHome]);

    return (
        <>
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