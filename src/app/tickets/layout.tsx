import type {ReactNode} from "react";
import TicketImpression from "@/components/tickets/TicketImpression";

export default function TicketingLayout({children}:{children:ReactNode}){
  return <>{children}<TicketImpression/></>;
}
