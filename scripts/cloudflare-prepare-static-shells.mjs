// Export only known public prerendered HTML, not the .next server directory.
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync,appendFileSync,statSync} from "node:fs";
import {join} from "node:path";
const root=".open-next",manifest=JSON.parse(readFileSync(".next/prerender-manifest.json","utf8"));
const directory=join(root,"assets","__gth_static_shells");
mkdirSync(directory,{recursive:true});
// Export only existing prerendered public pages. Dynamic routes, queries,
// authentication and expired ISR continue through the original Next handler.
const exact=new Set(["/","/hotels","/real-estate","/real-estate/tools","/stadiums","/tender/assistant","/tickets","/tickets/sports"]);
const shells={};
const builtAt=Date.now();
for(const [route,entry] of Object.entries(manifest.routes||{})){
 if(!exact.has(route)&&!/^\/stadiums\/[a-z0-9-]{1,70}$/.test(route))continue;
 const ttl=entry.initialRevalidateSeconds;
 if(ttl!==false&&(!Number.isSafeInteger(ttl)||ttl<1))continue;
 if(entry.initialStatus&&entry.initialStatus!==200)continue;
 const source=".next/server/app"+(route==="/"?"/index":route)+".html";
 if(!existsSync(source))continue;
 const content=readFileSync(source,"utf8");
 if(!/^<!DOCTYPE html>/i.test(content)||!content.includes("</html>")||content.length>1_500_000)continue;
 const name=(route==="/"?"index":route.slice(1).replaceAll("/","__"))+".gth-html";
 copyFileSync(source,join(directory,name));
 shells[route]={path:"/__gth_static_shells/"+name,expiresAt:ttl===false?null:Math.min(builtAt,statSync(source).mtimeMs)+ttl*1000};
}
writeFileSync(join(root,"gth-shell-manifest.mjs"),"export default "+JSON.stringify(shells)+";\n");
appendFileSync(join(root,"assets","_headers"),"\n/__gth_static_shells/*\n  X-Robots-Tag: noindex, nofollow\n  Content-Type: application/octet-stream\n  X-Content-Type-Options: nosniff\n");
console.log("Prepared public static/ISR shells:",JSON.stringify(Object.keys(shells)));
