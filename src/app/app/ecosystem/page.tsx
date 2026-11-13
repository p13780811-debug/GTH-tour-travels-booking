import {redirect} from "next/navigation";
import type {Metadata} from "next";

/** Backward-compatible in-app route: one Home, never a second dashboard. */
export const metadata:Metadata={
 title:"GTH PRO Home | Mobile App",
 robots:{index:false,follow:false},
};
export default function MobileEcosystemHome(){
 redirect("/app");
}
