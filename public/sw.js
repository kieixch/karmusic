/* KarMusic service worker: offline app shell only.
 * Audio streams and provider API responses are never cached here.
 */
const CACHE_VERSION = "karmusic-shell-v4";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-2911.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function cacheResponse(request, response) {
  if (!response.ok || response.type !== "basic") return response;
  const copy = response.clone();
  caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(async () => (await caches.match(request)) ?? Response.error());
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isCacheableAsset(request, url) {
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/_next/image")) return false;
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/demo/") ||
    /\.(?:css|js|woff2?|png|svg|webmanifest)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  if (isNextStaticAsset(url)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (!isCacheableAsset(event.request, url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => cacheResponse(event.request, response));
    }),
  );
});
