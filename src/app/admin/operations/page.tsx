import type {Metadata} from "next";
import OperationsDashboard from "@/components/admin/OperationsDashboard";
export const metadata:Metadata={title:"Operations Center | GTH PRO",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default function OperationsPage(){return <OperationsDashboard/>;}
