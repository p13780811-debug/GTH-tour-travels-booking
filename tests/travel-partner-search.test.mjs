import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
function compile(path, imports = {}, globals = {}) {
  const testModule = {exports: {}};
  vm.runInNewContext(ts.transpileModule(read(path), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX}}).outputText,
    {module: testModule, exports: testModule.exports, URL, URLSearchParams, Request, Response, ...globals, require: name => {if (name in imports) return imports[name]; throw new Error(name);}}, {timeout: 2000});
  return testModule.exports;
}
const engine = compile("src/lib/travel/partner-search.ts");
const {GET} = compile("src/app/api/travel/partner-search/route.ts", {
  "@/lib/travel/partner-search": engine,
  "next/server": {NextResponse: {json: (body, init) => Response.json(body, init), redirect: (url, status) => new Response(null, {status, headers: {Location: url}})}},
});

for (const [kind, suffix] of [["tours", "tours"], ["activities", "activities"], ["cars", "car rental"], ["transfers", "airport transfer"]]) {
  test(`${kind} first search preserves destination and category in the verified affiliate chain`, () => {
    const href = engine.partnerSearchHref(kind, "  São Paulo  ");
    const result = GET(new Request("https://www.gthproglobal.com" + href));
    assert.equal(result.status, 302);
    assert.equal(result.headers.get("cache-control"), "no-store");
    const affiliate = new URL(result.headers.get("location"));
    assert.equal(affiliate.origin, "https://tp.media");
    for (const [key, value] of Object.entries({campaign_id: "137", marker: "417668", p: "4110", trs: "504342", sub_id: `gth_${kind}_search`})) assert.equal(affiliate.searchParams.get(key), value);
    const destination = new URL(affiliate.searchParams.get("u"));
    assert.equal(destination.origin, "https://www.klook.com");
    assert.equal(destination.pathname, "/en-IN/search/result/");
    assert.equal(destination.searchParams.get("query"), `São Paulo ${suffix}`);
    assert.equal(result.headers.get("x-robots-tag"), "noindex, nofollow");
  });
}
test("explicit experience category survives the handoff", () => {
  const target = new URL(engine.buildPartnerSearch({kind: "activities", destination: "London", category: "Attraction tickets"}));
  assert.equal(new URL(target.searchParams.get("u")).searchParams.get("query"), "London Attraction tickets");
});
test("server rejects malformed, ambiguous and attacker-controlled redirect inputs", () => {
  for (const query of [
    "kind=unknown&destination=London", "kind=tours", "kind=tours&destination=javascript:alert(1)",
    "kind=tours&destination=https://evil.test", "kind=tours&destination=London&u=https://evil.test",
    "kind=cars&destination=London&destination=Paris", "kind=tours&destination=London&category=%3Cscript%3E",
    "kind=tours&destination=" + "a".repeat(81), "kind=transfers&destination=London%0d%0aLocation:evil",
  ]) assert.equal(GET(new Request("https://www.gthproglobal.com/api/travel/partner-search?" + query)).status, 400, query);
});
test("car and transfer searches submit directly without a review-then-search gate", () => {
  const form = read("src/components/travel/TravelPartnerSearch.tsx");
  assert.match(form, /action="\/api\/travel\/partner-search" method="GET" target="_blank"/);
  assert.doesNotMatch(form, /useState|onSubmit|Review rental details/);
  for (const page of ["cars", "transfers"]) assert.match(read(`src/app/${page}/page.tsx`), new RegExp(`<TravelPartnerSearch kind="${page}"`));
  assert.doesNotMatch(read("src/components/tours/TourSearchHandoff.tsx"), /Search .*on Klook/);
});
test("Tours and Activities expose only explicit, validated partner-search links after local filtering", () => {
  const discovery = compile("src/lib/tours/discovery.ts");
  const element = (type, props) => ({type, props});
  const {default: Hero} = compile("src/components/tours/TourSearchHero.tsx", {
    "react/jsx-runtime": {jsx: element, jsxs: element, Fragment: "fragment"},
    "next/image": {default: "img"}, "next/link": {default: "a"},
    "lucide-react": {ArrowRight: "arrow", Compass: "compass", Search: "search"},
    "@/components/travel/TravelSectionNav": {default: "nav"},
    "@/lib/tours/discovery": discovery, "@/lib/travel/partner-search": engine,
  });
  const collect=(root)=>{
    if(Array.isArray(root))return root.flatMap(collect);
    if(!root||typeof root!=="object")return [];
    return [root,...collect(root.props?.children)];
  };
  for(const basePath of ["/tours","/activities"]){
    const tree=Hero({basePath,filters:{...discovery.EMPTY_TOUR_SEARCH,city:"London"}});
    const nodes=collect(tree);
    const form=nodes.find(node=>node.type==="form");
    assert.equal(form.props.action,basePath+"#discover");
    assert.equal(form.props.onSubmit,undefined,"No unexpected popup from ordinary Search button");
    const external=nodes.filter(node=>node.type==="a"&&String(node.props.href).startsWith("/api/travel/partner-search?"));
    assert.equal(external.length,1);
    const link=external[0];
    assert.equal(link.props.target,"_blank");
    assert.equal(link.props.rel,"noopener noreferrer sponsored");
    const request=new URL(link.props.href,"https://www.gthproglobal.com");
    assert.equal(request.searchParams.get("kind"),basePath.slice(1));
    assert.equal(request.searchParams.get("destination"),"London");
    assert.equal(GET(new Request(request)).status,302);
    const invalid=collect(Hero({basePath,filters:{...discovery.EMPTY_TOUR_SEARCH,city:"javascript:alert(1)"}}));
    assert.equal(invalid.filter(node=>node.type==="a"&&String(node.props.href).startsWith("/api/travel/partner-search?")).length,0);
  }
});
