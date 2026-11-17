import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(path,deps={}) {
  const exports={};
  const source=ts.transpileModule(fs.readFileSync(path,"utf8"),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},
  }).outputText;
  new Function("exports","require",source)(exports,name=>{
    if (!(name in deps))throw Error("Unexpected module: "+name);
    return deps[name];
  });
  return exports;
}

const currency=load("src/lib/real-estate/investor-currency.ts");
const viral=load("src/components/share/ViralCardGenerator.tsx",{
  react:{useState:()=>[null,()=>{}]},
  "react/jsx-runtime":{jsx:()=>null,jsxs:()=>null},
});

test("all six NRI currencies share one deterministic illustrative reference",()=>{
  assert.deepEqual(Object.keys(currency.INR_PER_UNIT),["INR","USD","AED","GBP","EUR","SGD"]);
  assert.equal(currency.convertCurrency(89,"INR","USD"),1);
  assert.equal(currency.convertCurrency(100,"USD","INR"),8900);
  assert.equal(currency.convertCurrency(Number.NaN,"INR","USD"),null);
  const desk=fs.readFileSync("src/components/real-estate/NriInvestorDesk.tsx","utf8");
  assert.match(desk,/\["INR","USD","AED","GBP","EUR","SGD"\]/);
  assert.match(desk,/onCurrencyChange/);
  const card=fs.readFileSync("src/components/real-estate/ExplorerCard.tsx","utf8");
  assert.match(card,/inventory_min_price/);
  assert.match(card,/displayCurrency/);
  assert.match(card,/illustrative static FX conversion/i);
});

test("viral PNG image dimensions and safe source captions are first-party only",()=>{
  assert.deepEqual([...viral.VIRAL_DIMENSIONS.square],[1080,1080]);
  assert.deepEqual([...viral.VIRAL_DIMENSIONS.story],[1080,1920]);
  for(const path of ["/real-estate/approved-project","/tender/abc-123","/stadiums/eden-gardens"]){
    assert.equal(viral.viralSourceUrl(path),"https://www.gthproglobal.com"+path);
  }
  for(const unsafe of ["https://evil.com","//evil.com","/tender/../admin","/real-estate/slug?token=abc","/api/secrets"]){
    assert.equal(viral.viralSourceUrl(unsafe),"https://www.gthproglobal.com");
  }
  const source=fs.readFileSync("src/components/share/ViralCardGenerator.tsx","utf8");
  assert.match(source,/canvas\.toBlob/);
  assert.match(source,/navigator\.share/);
  assert.match(source,/@official\.gthpro/);
  assert.match(source,/gthproglobal\.com/);
  assert.doesNotMatch(source,/fetch\(|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});

test("Gold sorting keeps independently reviewed inventory and image-source gate",()=>{
  const sql=fs.readFileSync("supabase/migrations/20261117002000_property_verified_gold_sort.sql","utf8");
  assert.match(sql,/is_featured_gold desc/);
  assert.match(sql,/is_featured_gold and p\.verified/);
  assert.match(sql,/property_published_media/);
  assert.match(sql,/status='published'/);
  assert.match(sql,/properties_featured_gold_idx/);
  const cards=fs.readFileSync("src/components/real-estate/ExplorerCard.tsx","utf8");
  assert.match(cards,/p\.is_featured_gold === true && p\.verified === true/);
  assert.match(cards,/₹999\/mo \| \$29\/mo/);
  assert.match(cards,/claim-project/);
});

test("share action exists in all three first-party verticals",()=>{
  for(const file of ["src/components/real-estate/ExplorerCard.tsx","src/components/tender/TenderMarketplacePanels.tsx",
    "src/app/tender/[id]/page.tsx","src/app/stadiums/[slug]/page.tsx"]){
    const content=fs.readFileSync(file,"utf8");
    assert.match(content,/import ViralCardGenerator/);
    assert.match(content,/<ViralCardGenerator/);
  }
});
