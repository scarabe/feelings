// sw.js – Service Worker for Feelings Game
// Strategy: Cache First pour les assets statiques, Network First pour le reste.

const CACHE_NAME = 'feelings-game-v2';

// Tous les fichiers à mettre en cache à l'installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// ── INSTALL : mise en cache initiale ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : suppression des anciens caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : Cache First, fallback réseau ──────────────────────────────────
self.addEventListener('fetch', event => {
  // On ne gère que les requêtes GET sur notre origine
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Pas en cache → réseau, puis on met en cache pour la prochaine fois
      return fetch(event.request).then(response => {
        // On ne cache que les réponses valides
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      });
    }).catch(() => {
      // Hors ligne et pas en cache → page de fallback si disponible
      return caches.match('/index.html');
    })
  );
});
