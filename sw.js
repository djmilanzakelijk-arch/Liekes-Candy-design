/* Service worker — makes the shop playable offline. */

const CACHE = 'liekes-candy-2026-07-29.7';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './styles/main.css',
  './styles/screens.css',
  './src/main.js',
  './src/core/utils.js',
  './src/core/state.js',
  './src/core/audio.js',
  './src/core/fx.js',
  './src/core/i18n.js',
  './src/data/palette.js',
  './src/data/candies.js',
  './src/data/decorations.js',
  './src/data/customers.js',
  './src/data/upgrades.js',
  './src/data/events.js',
  './src/data/missions.js',
  './src/game/orders.js',
  './src/game/scoring.js',
  './src/render/shade.js',
  './src/render/candyArt.js',
  './src/render/decoArt.js',
  './src/render/candy.js',
  './src/render/shop.js',
  './src/ui/nav.js',
  './src/ui/modal.js',
  './src/ui/studio.js',
  './src/ui/shopScreen.js',
  './src/ui/storeScreen.js',
  './src/ui/collectionScreen.js',
  './src/ui/missions.js',
  './src/ui/moreScreen.js',
  './src/ui/staffScreen.js',
  './src/ui/staffEventUi.js',
  './src/ui/levelReward.js',
  './src/ui/transferUi.js',
  './src/core/transfer.js',
  './src/data/staff.js',
  './src/data/tools.js',
  './src/game/staffEvents.js',
  './src/render/tools.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // network-first for navigations so updates land quickly
  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // stale-while-revalidate: instant from cache, refreshed in the background,
  // so a new deploy lands on the next launch without a manual hard refresh
  e.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req).then(res => {
        if (res.ok && new URL(req.url).origin === location.origin){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
