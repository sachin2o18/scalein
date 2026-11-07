/* ScaleIn service worker — keeps the app + its libraries available offline.
   index.html is always fetched fresh when online (so your GitHub replace shows up on refresh). */
const CACHE = 'scalein-v10.6';
const LIBS = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)\//;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.add('./')).catch(() => {})); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {                       // your own files: network first, cache as fallback
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(m => m || (req.mode === 'navigate' ? caches.match('./') : undefined))));
  } else if (LIBS.test(req.url)) {                            // chart / excel / OCR libraries: cache first
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })));
  }                                                           // everything else (GitHub API, NSE…) goes straight to the network
});
