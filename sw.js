// ══════════════════════════════════════════
//  SERVICE WORKER — Accounting Prod. PWA
//  Caches static assets ONLY. Firebase/Firestore
//  requests are NEVER cached to prevent stale data.
// ══════════════════════════════════════════

const CACHE_NAME = 'accounting-prod-v60';

// Only cache static files that don't change between sessions
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './tank_calibration.json'
];

// Domains that must NEVER be cached (Firebase services)
const NO_CACHE_DOMAINS = [
  'firestore.googleapis.com',
  'www.googleapis.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'firebase.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'www.gstatic.com'
];

// Install — pre-cache static assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing, cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) {
              console.log('[SW] Deleting old cache:', k);
              return caches.delete(k);
            })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network-first for everything, cache fallback for static assets only
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // NEVER intercept Firebase API requests — let them go straight to network
  var isFirebase = NO_CACHE_DOMAINS.some(function(domain) {
    return url.hostname.includes(domain);
  });
  if (isFirebase) return; // Don't call respondWith — browser handles it normally

  // NEVER cache POST/PUT/DELETE requests
  if (event.request.method !== 'GET') return;

  // Immutable data files: CACHE-FIRST.
  // tank_calibration.json is ~588 KB gzipped and only ever changes when a new
  // version is deployed — and a deploy bumps CACHE_NAME, which discards the
  // old cache anyway. Re-fetching it on every launch (which the previous
  // network-first + no-store rule did) meant a 588 KB download each time the
  // app opened, and a flaky field connection turned that into a visible
  // "calibration failed to load" banner. Serving it from cache makes startup
  // instant and immune to a poor signal.
  var isImmutableData = /tank_calibration\.json$/.test(url.pathname);

  if (isImmutableData) {
    event.respondWith(
      caches.match(event.request).then(function(hit) {
        if (hit) return hit;                       // cached copy wins
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (HTML, icons, manifest): network-first with no-store, so
  // a code change is never masked by a stale cached copy. Falls back to cache
  // when offline.
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(function(response) {
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

// Listen for SKIP_WAITING message from the app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
