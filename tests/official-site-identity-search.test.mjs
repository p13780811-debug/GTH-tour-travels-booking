import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

function identityGraph(){
 const file=read("src/components/seo/SiteIdentitySchema.tsx");
 const compiled=ts.transpileModule(file,{compilerOptions:{
  module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022,
  jsx:ts.JsxEmit.ReactJSX,
 }}).outputText;
 const mod={exports:{}},origin="https://www.gthproglobal.com/";
 const fn=()=>{};
 const fake={
  "@/lib/site-config":{SITE_CONFIG:{contactEmail:"official@gthproglobal.com"}},
  "@/lib/seo/site":{
   siteUrl: path=>new URL(path,origin).toString(),
   safeStructuredData: obj=>JSON.stringify(obj).replace(/</g,"\\u003c"),
  },
  "react/jsx-runtime":{jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})},
 };
 vm.runInNewContext(compiled,{module:mod,exports:mod.exports,require:name=>{
  assert.ok(Object.hasOwn(fake,name),"Unexpected schema dependency: "+name);
  return fake[name];
 }},{timeout:2000});
 const instance=mod.exports.default();
 assert.equal(instance.tag,"script");
 assert.equal(instance.props.type,"application/ld+json");
 return JSON.parse(instance.props.dangerouslySetInnerHTML.__html);
}

test("one Google-compliant identity graph exists in root HEAD and no duplicate at homepage",()=>{
 const layout=read("src/app/layout.tsx"),home=read("src/components/home/FlagshipHome.tsx");
 const head=layout.slice(layout.indexOf("<head>"),layout.indexOf("</head>")+7);
 assert.equal((layout.match(/<SiteIdentitySchema \/>/g)||[]).length,1);
 assert.match(head,/<SiteIdentitySchema \/>/);
 assert.doesNotMatch(home,/SiteIdentitySchema|<HousePromotions/);
 const graph=identityGraph();
 assert.equal(graph["@context"],"https://schema.org");
 assert.equal(graph["@graph"].length,2);
 const organization=graph["@graph"].find(v=>v["@type"]==="Organization");
 const website=graph["@graph"].find(v=>v["@type"]==="WebSite");
 assert.ok(organization && website);
 assert.equal(organization.name,"GTH PRO");
 assert.equal(organization.url,"https://www.gthproglobal.com/");
 assert.equal(website.url,organization.url);
 assert.equal(website.publisher["@id"],organization["@id"]);
 assert.equal(website.name,organization.name);
 assert.equal(organization.email,"official@gthproglobal.com");
 for(const value of ["real estate","travel technology","tender"])
  assert.match(organization.description.toLowerCase(),new RegExp(value));
 assert.ok(website.hasPart.some(p=>p.url==="https://www.gthproglobal.com/verification"));
 for(const item of [...website.hasPart,...website.about]){
  assert.ok(item.url.startsWith("https://www.gthproglobal.com/"));
 }
 assert.ok(!JSON.stringify(graph).match(/aggregateRating|governmentAgency|reviewCount|iso6523Code|taxID|legalName|founder|isAccessibleForFree|supabase|service.role/i));
});

test("official About, Verification, policies and crawl signals all use existing public gated canonical routes",()=>{
 const about=read("src/app/about/page.tsx"),verify=read("src/app/verification/page.tsx");
 const robots=read("src/app/robots.ts"),sitemap=read("src/app/sitemap.ts");
 const policy=read("src/app/affiliate-disclosure/page.tsx");
 const site=read("src/lib/seo/site.ts");
 assert.match(about,/canonical:"\/about"/);
 assert.match(about,/href="\/verification"/);
 assert.match(verify,/canonical: "\/verification"/);
 assert.match(verify,/Verify GTH PRO Global/);
 for(const source of ["Nuitee","GetYourGuide","WeGoTrip","OpenStreetMap","Etios Profession"])
   assert.ok(verify.includes(source),source);
 for(const route of ["/about","/verification","/privacy-policy","/terms-and-conditions","/affiliate-disclosure"]){
  assert.ok(sitemap.includes('"'+route+'"'),route);
 }
 assert.match(robots,/allow: "\/"/);
 assert.match(robots,/disallow: privateRoutes/);
 assert.match(robots,/sitemap-index\.xml/);
 assert.match(site,/PRIMARY_ORIGIN = "https:\/\/www\.gthproglobal\.com"/);
 assert.match(read("src/app/layout.tsx"),/GTH_PUBLIC_LAUNCH_ENABLED/);
 assert.match(policy,/provider may collect information/);
 assert.doesNotMatch(verify,/SUPABASE_SERVICE_ROLE_KEY|private_key|EDGE_SECRET|TRAVELPAYOUTS_API_TOKEN/);
});

test("remove owner-unwanted house ad from homepage and shared footer without deleting portfolio data",()=>{
 const home=read("src/components/home/FlagshipHome.tsx");
 const footer=read("src/components/sections/EcosystemFooter.tsx");
 assert.doesNotMatch(home,/HousePromotions/);
 assert.doesNotMatch(footer,/HousePromotions/);
 assert.match(home,/href="\/verification"/);
 assert.match(footer,/\/verification/);
 assert.match(home,/className=\{styles\.cityFooter\}/);
 assert.match(footer,/EcosystemFooter/);
 assert.match(read("src/lib/portfolio/projects.ts"),/thali-treats-palava/);
 assert.match(read("src/app/page.tsx"),/return <FlagshipHome \/>/);
});
