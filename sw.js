/* Offline support, and updates only when you ask for them.

   The whole app (page, decoder, icons) lives in one cache, APP, which nothing
   replaces by itself: a new version of this worker installing in the background
   leaves a full APP alone. The only thing that empties it is Update now in the
   app, which clears the caches and reloads; the reload, finding APP empty,
   fetches the new version from the website and keeps it.

   version.json and RELEASES.md always go to the network, so the app can see
   that a newer version exists while it keeps running the one it has.

   VERSION is written by tools/bump-version.mjs. Changing it is also what makes
   the browser notice a new worker. */
const VERSION = "1.1.4";
const APP = "barcode-scanner-app";
const FILES = [
  "./index.html",
  "./worker.js",
  "./vendor/zxing-reader.js",
  "./vendor/zxing_reader.wasm",
  "./manifest.webmanifest",
  "./RELEASES.md",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png"
];
const LIVE_ONLY = /\/(version\.json|RELEASES\.md)$/;

/* Straight from the website, past the browser's own HTTP cache, which could
   otherwise hand back the previous version right after a release. */
const fresh = (url) => fetch(new Request(url, { cache: "reload" }));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP)
      .then((c) => c.match("./index.html").then((hit) => hit ? null :
        Promise.all(FILES.map((f) => fresh(f).then((res) => res.ok ? c.put(f, res) : null))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      /* also clears the per-version caches that 1.0.0 and 1.1.0 used */
      .then((keys) => Promise.all(keys.filter((k) => k !== APP).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (LIVE_ONLY.test(url.pathname)) return;

  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  event.respondWith(
    caches.open(APP).then((c) =>
      c.match(isPage ? "./index.html" : req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        /* Not kept yet: a first visit, or the reload straight after Update now. */
        return fresh(isPage ? "./index.html" : url.href).then((res) => {
          if (res && res.ok) c.put(isPage ? "./index.html" : req, res.clone());
          return res;
        });
      })
    )
  );
});
