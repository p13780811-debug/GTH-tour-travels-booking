import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>{if(n in imports)return imports[n];throw Error(n)},Date,URL});return module.exports;}
const repayment=load('src/lib/real-estate/repayment.ts');
const tools=load('src/lib/real-estate/decision-tools.ts',{'./repayment':repayment});
const scenario={price:120000,down:12000,buyingFees:0,annualRate:0,loanYears:10,monthlyRent:900,annualRentGrowth:0,monthlyOwnerCosts:0,annualAppreciation:0,annualInvestmentReturn:0,sellingPercent:0,years:10};
test('equal housing budgets reproduce a hand-calculated zero-interest rent/buy scenario',()=>{
 const r=tools.compareRentBuy(scenario);assert.ok(r);assert.equal(r.rows.length,10);assert.equal(r.monthlyRepayment,900);const end=r.rows.at(-1);assert.equal(end.loanBalance,0);assert.equal(end.buyerWealth,120000);assert.equal(end.renterWealth,12000);assert.equal(r.totalOwnerOutflow,120000);assert.equal(r.totalRent,108000);
});
test('the buyer invests their rent savings and buying fees have a real opportunity cost',()=>{
 const r=tools.compareRentBuy({...scenario,down:120000,buyingFees:12000,loanYears:1,years:1,monthlyRent:1000});const end=r.rows[0];assert.equal(end.buyerWealth,132000);assert.equal(end.renterWealth,132000);assert.equal(end.difference,0);
});
test('selling costs, falling values and short holding periods can reverse the comparison',()=>{
 const zero=tools.compareRentBuy({...scenario,years:1});const costs=tools.compareRentBuy({...scenario,years:1,sellingPercent:10,annualAppreciation:-10});assert.ok(costs.rows[0].buyerWealth<zero.rows[0].buyerWealth);assert.ok(costs.rows[0].difference<0);
});
test('invalid financial assumptions fail closed rather than producing plausible totals',()=>{
 for(const change of [{price:0},{down:120001},{years:1.5},{loanYears:0},{annualRate:Infinity},{annualAppreciation:-100},{annualInvestmentReturn:NaN},{sellingPercent:31},{monthlyRent:-1}])assert.equal(tools.compareRentBuy({...scenario,...change}),null);
});
test('prepayments reduce duration and interest; zero-rate and full payoff work',()=>{
 const r=tools.prepaymentScenario(120000,0,10,1000,0);assert.equal(r.months,60);assert.equal(r.monthsSaved,60);assert.equal(r.interestSaved,0);
 const p=tools.prepaymentScenario(100000,12,10,100,10000),b=tools.prepaymentScenario(100000,12,10,0,0);assert.ok(p.months<b.months);assert.ok(p.interest<b.interest);assert.ok(p.interestSaved>0);
 const full=tools.prepaymentScenario(100000,12,10,0,100000);assert.equal(full.months,0);assert.equal(full.interest,0);assert.equal(full.remainingBalance,0);
 assert.equal(tools.prepaymentScenario(100000,5,10,0,100001),null);
});
test('sale proceeds preserve a negative equity result and reject invalid deductions',()=>{
 assert.equal(tools.saleProceeds(100000,110000,5000,1000).net,-16000);assert.equal(tools.saleProceeds(100000,0,0,0).net,100000);assert.equal(tools.saleProceeds(100000,-1,0,0),null);
});
const seo=load('src/lib/real-estate/property-seo.ts');
const recent=load('src/lib/real-estate/recently-viewed.ts',{'./property-seo':seo});
test('recent history rejects injected routes, stale/future records and unstructured data',()=>{
 const now=1800000000000,row={slug:'actual-project',title:'Actual project',city:'Mumbai',viewedAt:now};
 const rows=recent.normalizeRecent([row,{...row,slug:'//evil.test'},{...row,slug:'future',viewedAt:now+1},{...row,slug:'old',viewedAt:now-31*86400000},{...row,slug:'no-title',title:{}},null],now);assert.equal(rows.length,1);assert.equal(rows[0].slug,'actual-project');assert.equal(recent.normalizeRecent({rows:[]},now).length,0);
});
test('revisiting moves the actual record to the front, updates its label and bounds history',()=>{
 const now=1800000000000,history=Array.from({length:20},(_,i)=>({slug:'project-'+i,title:'Project '+i,city:'City',viewedAt:now-i-1}));
 const updated=recent.rememberProperty(history,{slug:'project-5',title:'Renamed project',city:'Mumbai'},now);assert.equal(updated.length,12);assert.equal(updated[0].slug,'project-5');assert.equal(updated[0].title,'Renamed project');assert.equal(updated.filter(r=>r.slug==='project-5').length,1);
});
