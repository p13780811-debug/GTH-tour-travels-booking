import type {ReactNode} from "react";
import TravelSectionNav from "@/components/travel/TravelSectionNav";

/** Preserve each page's existing metadata and content, while enabling cross-category discovery. */
export default function TravelCategoryLayout({children}:{children:ReactNode}){
 return <><TravelSectionNav />{children}</>;
}
