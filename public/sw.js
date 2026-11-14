// ST-319 (I348): Void Runner service worker (root scope in dist - scripts/build.mjs copies
// public/sw.js -> dist/sw.js so its scope covers index.html + src + vendor + assets + public).
// Versioned cache-first: the app is an import-map module graph (no bundle), so the shell is
// precached and every same-origin GET is runtime-cached after the first online load;
// navigation is network-first with a cached-shell offline fallback. Dev/probes never register
// this - registration is prod-gated in src/main.js via <meta vr-build=prod> (R-E37-2).
const CACHE = 'vr-shell-v1';
const PRECACHE = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('vr-shell-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
