"use client";

import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import ChatBot from "./ChatBot";
import EcosystemFooter from "./sections/EcosystemFooter";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRealEstate = pathname?.startsWith("/real-estate");
  const isFlagship = pathname === "/";
  const isAppHome = pathname === "/app";

  return (
    <>
      {/* Keep approved Real Estate self-contained; other routes share the mobile app bar. */}
      <div className={`min-h-screen min-w-0 ${isRealEstate ? "pb-0" : "pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0"}`}>
        {children}
      </div>
      {!isRealEstate && <MobileNav />}
      {!isRealEstate && !isFlagship && !isAppHome && (
        <>
          <ChatBot />
          <EcosystemFooter />
        </>
      )}
    </>
  );
}
