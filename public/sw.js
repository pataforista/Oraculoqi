/* sw.js — Oráculo Taoísta */
const CACHE_VERSION = "oraculo-taoista-v2.2.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./dataset_taoista.js",
  "./icons/enso-8bit.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("oraculo-taoista-") && k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isAllowedOrigin = url.origin === self.location.origin ||
    url.hostname.includes("fonts") ||
    url.hostname.includes("unpkg.com") ||
    url.hostname.includes("esm.sh") ||
    url.hostname.includes("html2canvas");

  if (!isAllowedOrigin) return;
  if (req.method !== "GET") return;

  // Navigation / HTML requests
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // CDN assets / external fonts strategy: stale-while-revalidate
  const isCdn = url.hostname.includes("unpkg.com") || 
                url.hostname.includes("esm.sh") || 
                url.hostname.includes("fonts.googleapis.com") || 
                url.hostname.includes("fonts.gstatic.com");

  if (isCdn) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Local assets cacheFirst
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    return new Response("Offline resource", { status: 404 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(req, { ignoreSearch: true });
  const freshPromise = fetch(req).then((fresh) => {
    if (fresh.ok) {
      cache.put(req, fresh.clone());
    }
    return fresh;
  }).catch(() => null);

  const response = cached || await freshPromise;
  return response || new Response("Servicio no disponible", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    
    // Fallback to offline.html for navigation
    const offlinePage = await caches.match("./offline.html");
    if (offlinePage) return offlinePage;
    
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}
