import type {Metadata} from "next";
import TenderServicesDashboard from "@/components/admin/TenderServicesDashboard";
export const metadata:Metadata={title:"Tender Service Requests | GTH PRO Operations",robots:{index:false,follow:false}};
export default function TenderServiceAdminPage(){return <TenderServicesDashboard/>;}
