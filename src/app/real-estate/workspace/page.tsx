import {SERVICE_KINDS} from '@/lib/real-estate/workspace-contract';
import type {Metadata} from 'next';
import PropertyWorkspace from '@/components/real-estate/PropertyWorkspace';
import JourneyNav from '@/components/real-estate/JourneyNav';
import BottomNav from '@/components/mobile/BottomNav';
export const metadata:Metadata={title:'Private property workspace | GTH PRO',description:'Manage account property alerts, private non-binding offer discussions and property support.',robots:{index:false,follow:false}};
export default async function WorkspacePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const p=await searchParams;const tab=typeof p.tab==='string'&&['notifications','alerts','offers','saved','reviews','services','analytics','inventory','crm','crm_tasks','moderation','reports','service_admin'].includes(p.tab)?p.tab:'notifications';const inventory=typeof p.inventory==='string'&&/^[0-9a-f-]{36}$/i.test(p.inventory)?p.inventory:'';const project=typeof p.project==='string'&&/^[1-9]\d{0,15}$/.test(p.project)?p.project:'';const kind=typeof p.kind==='string'&&(SERVICE_KINDS as readonly string[]).includes(p.kind)?p.kind:'valuation';return <main className="gth-container pb-28 pt-8"><JourneyNav/><PropertyWorkspace initialTab={tab} initialInventory={inventory} initialProject={project} initialKind={kind}/><BottomNav/></main>;}
