import type {Metadata} from "next";
import EnquiryInbox from "@/components/admin/EnquiryInbox";
export const metadata:Metadata={title:"Private enquiry inbox | GTH PRO",robots:{index:false,follow:false}};
export default function Page(){return <EnquiryInbox/>;}
