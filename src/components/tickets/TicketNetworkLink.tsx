import {ArrowUpRight} from "lucide-react";
import {ticketNetworkHref} from "@/lib/travel/ticketnetwork";

export default function TicketNetworkLink({query,label="Book Tickets",className=""}:{
  query?:string;
  label?:string;
  className?:string;
}){
  return <a href={ticketNetworkHref(query)} target="_blank" rel="noopener noreferrer sponsored"
    className={"gth-btn-gold inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold "+className}>
    {label}<ArrowUpRight size={16} aria-hidden="true"/>
  </a>;
}
