"use client";

import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import ChatBot from "./ChatBot";
import Footer from "./Footer";

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // ✅ Real estate detection
    const isRealEstate = pathname?.startsWith("/real-estate");

    return (
        <>
            {/* ✅ CONTENT */}
            <main className="min-h-screen pb-24 md:pb-0">
                {children}
            </main>

            {/* ❌ REAL ESTATE → NO global UI */}
            {!isRealEstate && (
                <>
                    <MobileNav />
                    <ChatBot />
                    <Footer />
                </>
            )}
        </>
    );
}