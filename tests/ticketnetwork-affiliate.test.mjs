import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {loadTenderTs} from "./helpers/tender-upgrade-loader.mjs";

const load=value=>loadTenderTs("src/lib/travel/ticketnetwork.ts",{},{
  process:{env:{NEXT_PUBLIC_TICKETNETWORK_AFFILIATE_URL:value}}
});
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("CJ search wraps a bounded sanitized query in the fixed TicketNetwork origin",()=>{
  const api=load(undefined);
  const cj=new URL(api.ticketNetworkHref("  Montréal & Wembley   /\nStadium? ‮  "));
  assert.equal(cj.origin,"https://www.jdoqocy.com");
  assert.equal(cj.pathname,"/click-101921736-11072033");
  const destination=new URL(cj.searchParams.get("url"));
  assert.equal(destination.origin,"https://www.ticketnetwork.com");
  assert.equal(destination.pathname,"/search");
  assert.equal(destination.searchParams.get("q"),"Montréal & Wembley Stadium");
  assert.ok(api.ticketNetworkQuery("x".repeat(300)).length<=120);
  assert.equal(new URL(api.ticketNetworkHref("??")).search,"");
});

test("official CJ override is accepted and arbitrary destinations fall back",()=>{
  assert.equal(load("https://www.jdoqocy.com/click-1-2").ticketNetworkHref(),"https://www.jdoqocy.com/click-1-2");
  for(const value of ["http://www.jdoqocy.com/click-1-2","https://www.jdoqocy.com.lookalike.example/click-1-2",
    "https://www.jdoqocy.com/click-1-2?url=https://example.com","https://www.jdoqocy.com/other"]){
    assert.equal(load(value).ticketNetworkHref(),"https://www.jdoqocy.com/click-101921736-11072033");
  }
});

test("ticketing routes carry one small pixel and safe outbound anchors",()=>{
  assert.match(read("src/components/tickets/TicketNetworkLink.tsx"),/target="_blank" rel="noopener noreferrer sponsored"/);
  const pixel=read("src/components/tickets/TicketImpression.tsx");
  assert.match(pixel,/lduhtrp\.net\/image-101921736-11072033/);
  assert.match(pixel,/width=\{1\} height=\{1\}/);
  for(const route of ["tickets","stadiums"]){
    assert.equal(read("src/app/"+route+"/layout.tsx").match(/<TicketImpression\/>/g)?.length,1);
  }
  assert.doesNotMatch(read("src/app/layout.tsx"),/TicketImpression/);
});
