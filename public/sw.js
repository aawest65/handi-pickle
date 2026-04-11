const CACHE = "handipick-v4";
const PRECACHE = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Network-first for: API routes, auth, Next.js internals, and HTML page navigations
  // (navigations must always be fresh so auth redirects and role changes take effect)
  const isNavigation = event.request.mode === "navigate";
  const isNetworkFirst =
    isNavigation ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/");

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (icons, fonts, images, etc.)
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          if (response.status >= 300) return response; // never cache errors or redirects
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
    )
  );
});
