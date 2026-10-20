/* GTH PRO v2: only immutable public assets are cached. Booking and private data remain network-only. */
const OFFLINE_CACHE="gth-mobile-offline-v2";
const STATIC_CACHE="gth-mobile-static-v2";
const OFFLINE="/offline.html";
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.add(OFFLINE)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys
    .filter(name=>name.startsWith("gth-mobile-")&&!([OFFLINE_CACHE,STATIC_CACHE].includes(name)))
    .map(name=>caches.delete(name)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  if(request.mode==="navigate"){
    event.respondWith(fetch(request).catch(async()=>await caches.match(OFFLINE)||Response.error()));
    return;
  }
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const publicAsset=url.pathname.startsWith("/_next/static/") ||
    ["/gth-app-brand.svg","/app-icon/192","/app-icon/512"].includes(url.pathname);
  if(!publicAsset)return;
  event.respondWith(caches.open(STATIC_CACHE).then(async cache=>{
    const cached=await cache.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok&&response.type==="basic")await cache.put(request,response.clone());
    return response;
  }));
});
