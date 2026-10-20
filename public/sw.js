/* GTH PRO install shell v1. Never cache APIs, accounts, private data, or HTML pages. */
const CACHE = "gth-mobile-offline-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("gth-mobile-offline-") && key !== CACHE)
        .map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  // All user pages are network-only; an offline informational fallback is safe.
  event.respondWith(fetch(event.request).catch(async () =>
    (await caches.match(OFFLINE)) || Response.error()));
});
