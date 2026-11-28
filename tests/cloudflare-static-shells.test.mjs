import test from "node:test";
import assert from "node:assert/strict";
import {selectStaticShell,serveStaticShell,canonicalReadRedirect} from "../scripts/cloudflare-shell-routing.mjs";
const now=1000,shells={"/tickets":{path:"/__gth_static_shells/tickets.gth-html",expiresAt:null},"/stadiums/wankhede-stadium":{path:"/__gth_static_shells/stadium.gth-html",expiresAt:2000}};
const req=(path,init)=>new Request("https://preview.example.com"+path,init);
test("static shell route cannot intercept authentication, RSC, writes or expired ISR",()=>{
 assert.equal(selectStaticShell(req("/tickets?q=Mumbai"),shells,now),shells["/tickets"].path);
 assert.equal(selectStaticShell(req("/stadiums/wankhede-stadium"),shells,2000),null);
 for(const r of [req("/tickets?unknown=1"),req("/tickets?q=Mumbai&q=Delhi"),req("/tickets",{method:"POST"}),req("/tickets",{headers:{RSC:"1"}}),req("/tickets",{headers:{Cookie:"session=private"}}),req("/tickets",{headers:{Authorization:"Bearer private"}}),req("/admin"),new Request("https://gthproglobal.com/tickets")])assert.equal(selectStaticShell(r,shells,now),null);
});
test("static shell streams HTML with security headers and does not forward visitor credentials",async()=>{
 const assets={fetch:async r=>{assert.equal(new URL(r.url).pathname,shells["/tickets"].path);assert.equal(r.headers.has("authorization"),false);return new Response("<html>test</html>",{headers:{"X-Robots-Tag":"noindex","Content-Type":"application/octet-stream"}})}};
 const result=await serveStaticShell(req("/tickets"),assets,shells);
 assert.equal(await result.text(),"<html>test</html>");
 assert.match(result.headers.get("content-type"),/text\/html/);
 assert.equal(result.headers.get("x-frame-options"),"DENY");
 assert.equal(result.headers.get("x-gth-static-shell"),"build");
});

test("canonical redirect preserves exact path and query, fixed host, original method safety",()=>{
 const result=canonicalReadRedirect(new Request("https://gthproglobal.com//evil.example/path?city=Kolkata"));
 assert.equal(result.status,308);
 assert.equal(new URL(result.headers.get("location")).origin,"https://www.gthproglobal.com");
 assert.equal(new URL(result.headers.get("location")).pathname,"//evil.example/path");
 assert.equal(new URL(result.headers.get("location")).searchParams.get("city"),"Kolkata");
 assert.match(result.headers.get("cache-control"),/no-store/);
 assert.equal(canonicalReadRedirect(new Request("https://gthproglobal.com/api/private",{method:"POST"})),null);
 assert.equal(canonicalReadRedirect(new Request("https://www.gthproglobal.com/hotels")),null);
 assert.equal(canonicalReadRedirect(new Request("https://preview.example.com/")),null);
});
