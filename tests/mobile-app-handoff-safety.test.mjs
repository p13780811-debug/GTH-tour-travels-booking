import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const evalModule=(source,imports={})=>{
 const mod={exports:{}};
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(compiled,{exports:mod.exports,module:mod,require:name=>imports[name]},{timeout:2000});
 return mod.exports;
};
const dashboard=evalModule(read("src/lib/mobile/app-dashboard.ts"));
const preferences=evalModule(read("src/lib/mobile/app-preferences.ts"),{"./app-dashboard":dashboard});
const services=dashboard.appServices;

test("existing shortcuts and Cruises remain inside the explicit app handoff flow",()=>{
 assert.equal(services.length,18);
 for(const id of ["flights","hotels","property","tenders","transfers","cars","tours","insurance","destinations","esim","saved-property","property-tools","broker-catalog","saved-tenders","tender-help","cruises","stadiums","tickets"])assert.ok(services.some(s=>s.id===id));
 assert.equal(new Set(services.map(s=>s.id)).size,18);
 for(const service of services){
  const target=dashboard.mobileServiceHref(service);
  assert.ok(target.startsWith("/app/"),`${service.id} escaped the app: ${target}`);
  assert.ok(service.href.startsWith("/")&&!service.href.startsWith("//"));
  assert.equal(preferences.appServiceForPath(target),service.id);
 }
 assert.equal(dashboard.mobileWebServices().length,13);
 assert.equal(dashboard.mobileServiceHref(services.find(s=>s.id==="flights")),"/app/flights");
 assert.equal(dashboard.mobileServiceHref(services.find(s=>s.id==="transfers")),"/app/services/transfers");
});

test("service gateway only handles built-in services, never supplied URLs or arbitrary IDs",()=>{
 for(const id of ["transfers","cars","tours","insurance","esim","saved-property","property-tools","broker-catalog","saved-tenders","tender-help"]){
  const service=dashboard.mobileWebService(id);
  assert.equal(service?.id,id);
  assert.equal(service.href.startsWith("/app/"),false);
 }
 for(const id of ["flights","hotels","property","tenders","admin","https://bad.example","../admin","%2Fapi",""]){
  assert.equal(dashboard.mobileWebService(id),undefined);
 }
 const route=read("src/app/app/services/[id]/page.tsx");
 assert.match(route,/generateStaticParams/);
 assert.match(route,/dynamicParams = false/);
 assert.match(route,/if \(!service\) notFound\(\)/);
 assert.match(route,/href=\{service.href\}/);
 assert.match(route,/target="_blank"/);
 assert.match(route,/rel="noopener noreferrer"/);
 assert.match(route,/official|provider|issuing authorities/i);
 assert.doesNotMatch(route,/service_role|NEXT_PUBLIC_.*SECRET|Math\.random/);
});

test("home and recent shortcuts use the same in-app gateway; website targets remain explicit",()=>{
 const grid=read("src/components/mobile/AppServiceGrid.tsx");
 assert.match(grid,/href=\{mobileServiceHref\(service\)\}/);
 assert.equal((grid.match(/href=\{mobileServiceHref\(service\)\}/g)||[]).length,2);
 assert.doesNotMatch(grid,/href=\{service.href\}/);
 const app=read("src/app/app/page.tsx");
 assert.match(app,/MobileAppDashboard/);
 const root=read("src/app/manifest.ts");
 assert.match(root,/scope: "\/app"/);
 const layout=read("src/components/LayoutWrapper.tsx");
 assert.match(layout,/pathname\?\.startsWith\("\/app\/"/);
});

test("optional discovery fetches are abortable and keep the approved data/permission controls",()=>{
 const source=read("src/lib/mobile/discovery.ts");
 assert.match(source,/new AbortController\(\)/);
 assert.match(source,/controller.abort\(\),4500/);
 assert.equal((source.match(/abortSignal\(controller.signal\)/g)||[]).length,3);
 assert.match(source,/clearTimeout\(timer\)/);
 assert.match(source,/Promise.allSettled/);
 assert.match(source,/\.eq\("source_verified",true\)/);
 assert.match(source,/\.eq\("is_public",true\)/);
 assert.doesNotMatch(source,/SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SECRET/);
});
