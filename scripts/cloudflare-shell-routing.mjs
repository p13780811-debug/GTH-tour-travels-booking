// No framework, SDK, private data or user-specific HTML on the static fast path.
export function selectStaticShell(request,shells,now=Date.now()){
 if(request.method!=="GET")return null;
 const url=new URL(request.url);
 if(url.hostname==="gthproglobal.com")return null; // existing canonical redirect stays authoritative
 for(const name of ["authorization","cookie","range","rsc","next-router-state-tree","next-router-prefetch","next-router-segment-prefetch","next-action","x-middleware-prefetch"])if(request.headers.has(name))return null;
 const accept=request.headers.get("accept")||"*/*";
 if(!accept.includes("text/html")&&!accept.includes("*/*"))return null;
 const shell=Object.prototype.hasOwnProperty.call(shells,url.pathname)?shells[url.pathname]:null;
 if(!shell||shell.expiresAt!==null&&now>=shell.expiresAt)return null;
 if(url.search){
  const field=url.pathname==="/tickets"?"q":url.pathname==="/tender/assistant"?"tenderId":null;
  if(!field||url.search.length>600||url.searchParams.getAll(field).length!==1||[...url.searchParams.keys()].some(k=>k!==field))return null;
 }
 return shell.path;
}
export function publicSecurityHeaders(response){
 const headers=new Headers(response.headers);
 headers.set("X-Frame-Options","DENY");
 headers.set("X-Content-Type-Options","nosniff");
 headers.set("Referrer-Policy","strict-origin-when-cross-origin");
 headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=()");
 headers.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
 return headers;
}
export async function serveStaticShell(request,assets,shells){
 const path=selectStaticShell(request,shells);
 if(!path||!assets)return null;
 try{
  const url=new URL(path,request.url);
  const asset=await assets.fetch(new Request(url));
  if(asset.status!==200||!asset.body)return null;
  const headers=publicSecurityHeaders(asset);
  headers.set("Content-Type","text/html; charset=utf-8");
  headers.set("Cache-Control","private, no-store");
  headers.set("X-GTH-Static-Shell","build");
  headers.delete("X-Robots-Tag"); // actual page metadata (preview/production) is in the built HTML
  headers.delete("Content-Disposition");
  return new Response(asset.body,{status:200,headers});
 }catch{return null;}
}
