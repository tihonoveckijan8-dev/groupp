/* BandPlan service worker: cache only the app shell and the Supabase client bundle.
 * WHY: never cache authenticated Supabase API responses; cache keys do not safely isolate
 * private account data by Authorization header.
 */
const V = 'bandplan-v17';
const SUPABASE_BUNDLE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const SHELL = [
  './', 'index.html', 'bandplan.css', 'bandplan.js', 'bandplan-cloud.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'apple-touch-icon.png', SUPABASE_BUNDLE
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(V).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== V).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSupabaseBundle = url.href === SUPABASE_BUNDLE;

  // Supabase Auth, REST, Storage and Realtime traffic is intentionally network-only.
  if (!isSupabaseBundle && url.origin !== self.location.origin) return;
  if (!isSupabaseBundle && request.mode !== 'navigate' &&
      !/\\.(?:html|css|js|png|webmanifest|svg|woff2?|ico)$/i.test(url.pathname)) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: !isSupabaseBundle }).then(hit => {
      if (hit) return hit;
      return fetch(request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(V).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match('index.html'));
    })
  );
});
