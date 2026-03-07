/* sw.js — Oráculo Taoísta */
const CACHE_VERSION = "oraculo-taoista-v2.1.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./dataset_taoista.js",
  "./Galaxy.css",
  "./ElectricBorder.css",
  "./ProfileCard.css",
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

  if (url.origin !== self.location.origin && !url.hostname.includes("fonts")) return;
  if (req.method !== "GET") return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
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

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}
