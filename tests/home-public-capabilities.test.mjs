import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const home=read("src/app/page.tsx");
const flagship=read("src/components/home/FlagshipHome.tsx");
const proof=read("src/components/home/HomeCapabilityProof.tsx");
const css=read("src/components/home/FlagshipHome.module.css");

test("flagship remains the approved cinematic home and brand has full crawler-readable text",()=>{
 assert.match(home,/return <FlagshipHome \/>/);
 assert.match(flagship,/className=\{styles\.earth\}/);
 assert.match(flagship,/BrandVideo name="logo-motion"/);
 assert.match(flagship,/className=\{styles\.pillars\}/);
 assert.match(flagship,/className=\{styles\.cityFooter\}/);
 assert.match(flagship,/<h1 className=\{styles\.brand\} id="flagship-heading" aria-label="GTH PRO">/);
 assert.match(flagship,/<span className=\{styles\.brandGold\}>PR<\/span><BrandGlobe \/><span className="sr-only">O<\/span>/);
 assert.match(flagship,/import HomeCapabilityProof from "\.\/HomeCapabilityProof"/);
 assert.match(flagship,/<HomeCapabilityProof \/>/);
 assert.ok(flagship.indexOf("<HomeCapabilityProof />")>flagship.indexOf('className={styles.pillars}'));
 assert.ok(flagship.indexOf("<HomeCapabilityProof />")<flagship.indexOf('className={styles.capabilities}'));
});

test("public capability proof is server-rendered semantic HTML with grounded feature links",()=>{
 assert.doesNotMatch(proof,/"use client"|useEffect|useState|fetch\(|setInterval|<script|iframe|dangerouslySetInnerHTML/);
 assert.match(proof,/<section className=\{styles\.proofSection\}/);
 assert.match(proof,/aria-labelledby="gth-public-capabilities"/);
 assert.match(proof,/Three connected platforms\. Real tools and searchable public pages\./);
 for(const label of ["Real Estate","Travel","Tender"]){
   assert.ok(proof.includes('title: "'+label+'"'),"Missing platform: "+label);
 }
 const urls=[...proof.matchAll(/href: "(\/[^"]+)"/g)].map(x=>x[1]);
 const expected=[
   "/real-estate","/real-estate/registry","/real-estate/tools",
   "/flights","/hotels","/tours","/destinations",
   "/tender","/tender/services","/partners"
 ];
 assert.deepEqual(urls,expected);
 for(const url of urls){
   assert.ok(existsSync(new URL("../src/app"+url+"/page.tsx",import.meta.url)),"Non-existent feature route: "+url);
 }
 assert.doesNotMatch(proof,/\/admin|\/api|\/app\/|\/search|\/tender\/assistant/);
});

test("no fake live metrics, provider guarantees, security internals or new database load",()=>{
 assert.doesNotMatch(proof,/100% ISR|sub.50|verified active paths|185,000|185000|12,000|12000|perfect score|guaranteed booking|guaranteed results/i);
 assert.doesNotMatch(proof,/service[_-]role|SUPABASE|secret|NEXT_PUBLIC_|access[_-]token|database shard|API key/i);
 assert.match(proof,/final price, availability and checkout/);
 assert.match(proof,/confirm deadlines and eligibility with the issuing authority/);
 assert.match(home,/source-backed public tender research/);
});

test("styles remain in the existing homepage module and respect its existing navy/gold theme",()=>{
 for(const selector of [".proofSection",".proofInner",".proofGrid",".proofCard",".proofLink",".proofFooter"]){
   assert.ok(css.includes(selector),selector);
 }
 assert.match(css,/\.proofSection \{[\s\S]*?background: var\(--flag-navy\)/);
 assert.match(css,/\.proofCard \{[\s\S]*?border: 1px solid var\(--flag-edge\)/);
 assert.match(css,/\.proofLink \{[\s\S]*?color: var\(--text\)/);
 assert.match(css,/@media \(max-width: 680px\) \{\s*\.proofSection/);
 assert.doesNotMatch(proof,/style=\{|<style/);
 const shared=read("src/app/globals.css");
 assert.ok(shared.includes(".gth-btn-gold"));
});
