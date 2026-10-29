/** Device preferences and exports use only already-public property references. */
export const HIDDEN_PROPERTIES_KEY='gth-estate-hidden-v1';
export type HiddenProperty={slug:string;title:string;hiddenAt:number};
export function normalizeHidden(raw:unknown,now=Date.now()):HiddenProperty[]{
 if(!Array.isArray(raw))return [];const seen=new Set<string>();return raw.flatMap(item=>{if(!item||typeof item!=='object'||typeof item.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(item.slug)||item.slug.length>180||typeof item.title!=='string'||!item.title.trim()||item.title.length>180||/[<>\u0000-\u001f]/.test(item.title)||!Number.isFinite(item.hiddenAt)||item.hiddenAt>now||item.hiddenAt<now-90*86400000||seen.has(item.slug))return [];seen.add(item.slug);return [{slug:item.slug,title:item.title.trim(),hiddenAt:item.hiddenAt}];}).slice(0,200);
}
export function hideProperty(raw:unknown,property:{slug:string;title:string},now=Date.now()):HiddenProperty[]{const rows=normalizeHidden(raw,now);return normalizeHidden([{slug:property.slug,title:property.title,hiddenAt:now},...rows.filter(r=>r.slug!==property.slug)],now);}
export function workspaceReturn(raw:unknown):string|null {
 if(typeof raw!=='string'||raw.length>1200||!raw.startsWith('/real-estate/workspace')||/[\\\u0000-\u001f]/.test(raw))return null;
 try{const u=new URL(raw,'https://gth.invalid');if(u.origin!=='https://gth.invalid'||u.pathname!=='/real-estate/workspace'||u.hash)return null;const allowed=['tab','inventory','project','kind'];if([...u.searchParams.keys()].some(k=>!allowed.includes(k)||u.searchParams.getAll(k).length!==1))return null;
 const tab=u.searchParams.get('tab');if(tab&&!['notifications','alerts','offers','saved','reviews','services','analytics','inventory','crm','crm_tasks','moderation','reports','service_admin'].includes(tab))return null;
 const id=u.searchParams.get('inventory'),project=u.searchParams.get('project'),kind=u.searchParams.get('kind');if(id&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return null;if(project&&!/^[1-9]\d{0,15}$/.test(project))return null;if(kind&&!['valuation','legal','moving','interiors','crm_feed','virtual_tour','translation','registry','open_house','loan_consultation','listing_report'].includes(kind))return null;
 return u.pathname+(u.searchParams.size?'?'+u.searchParams:'');}catch{return null;}
}
/** Spreadsheet exports escape quotes, CRLF and spreadsheet formula prefixes. */
export function safeCsv(rows:readonly (readonly unknown[])[]):string {return '\ufeff'+rows.map(row=>row.map(value=>{let s=String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(',')).join('\r\n')+'\r\n';}

export function askingAreaRates(amount:unknown,area:unknown,basis:unknown,purpose:unknown){const price=Number(amount),sqft=Number(area);if(purpose!=="buy"||!["carpet","built_up","plot"].includes(String(basis))||!Number.isFinite(price)||!Number.isFinite(sqft)||price<=0||sqft<=0)return null;return {perSqft:price/sqft,perSqm:price/(sqft*0.09290304),basis:String(basis)};}
