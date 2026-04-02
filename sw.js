const CACHE_NAME = 'spaza-market-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/translations.js',
  '/js/firebase-config.js',
  '/css/app.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore') || e.request.url.includes('firebase')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'Spaza Market', {
    body: data.body || 'New activity on Spaza Market',
    icon: '/images/icon-192.png',
    badge: '/images/icon-72.png',
    data: data.url || '/'
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
