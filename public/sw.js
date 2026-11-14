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

/**
 * Follow a locally generated opt-in watch notification back to its first-party
 * research record. No push subscription, background polling or third-party call.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = event.notification.data?.path;
  if (typeof path !== "string" || path.length > 350 ||
      !path.startsWith("/") || path.startsWith("//") || path.includes("\\\\")) return;
  const url = new URL(path, self.location.origin);
  if (url.origin !== self.location.origin || !["http:", "https:"].includes(url.protocol)) return;
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(async (windows) => {
    const open = windows.find((client) => client.url === url.href);
    if (open) await open.focus();
    else await self.clients.openWindow(url.href);
  }));
});
