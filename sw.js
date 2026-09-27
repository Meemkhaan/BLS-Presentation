/* BLS presentation — offline cache
   Lets the hosted GitHub Page keep working with no connectivity after one visit.
   Path-relative, so the same file serves /BLS-Presentation/ and any subfolder. */
const VERSION = 'bls-deck-v2';

const ASSETS = [
  './',
  './index.html',
  './assets/fonts/anton-latin-ext.woff2',
  './assets/fonts/anton-latin.woff2',
  './assets/fonts/anton-vietnamese.woff2',
  './assets/fonts/noto-nastaliq-urdu-arabic.woff2',
  './assets/fonts/noto-nastaliq-urdu-latin-ext.woff2',
  './assets/fonts/noto-nastaliq-urdu-latin.woff2',
  './assets/img/aed-1.jpg',
  './assets/img/aed-2.jpg',
  './assets/img/ambulance-1.jpg',
  './assets/img/ambulance-2.jpg',
  './assets/img/call-help-1.jpg',
  './assets/img/call-help-2.jpg',
  './assets/img/check-response-1.jpg',
  './assets/img/check-response-2.jpg',
  './assets/img/chest-compressions-1.jpg',
  './assets/img/cpr-training-1.jpg',
  './assets/img/cpr-training-2.jpg',
  './assets/img/Handwashing.jpg',
  './assets/img/heimlich-maneuver.jpg',
  './assets/img/recovery-position-1.jpg',
  './assets/img/recovery-position-2.jpg',
  './assets/img/youth-training.jpg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      // add individually: one bad file must not void the whole precache
      .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // nothing third-party to serve

  /* Pages: network-first, so deck edits land whenever there is a connection;
     falls back to cache when there isn't. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  /* Images + fonts: cache-first, refreshed in the background. */
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
