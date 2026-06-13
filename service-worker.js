const CACHE_NAME = 'm361-empori-v9';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.json',
  '/assets/style/nav-style.css',
  '/assets/style/responsive.css',
  '/scripts/nav-script.js',
  '/scripts/guide.js',
  '/assets/images/logom361_rosso.jpg',
  '/faviconm361.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS.map(u => new Request(u, { cache: 'reload' }))))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first: prova sempre la rete, usa la cache solo se offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match('/index.html'))
    )
  );
});

// ── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'M361', body: '', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch (_) {}

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Manda banner in-app a tutte le finestre aperte
      list.forEach(c => c.postMessage({ type: 'm361-push', title: data.title, body: data.body }));

      // Se l'app è in foreground, iOS scarta subito la notifica OS — la saltiamo.
      // Il banner in-app (postMessage sopra) è sufficiente quando l'app è aperta.
      const isVisible = list.some(c => c.visibilityState === 'visible');
      if (isVisible) return Promise.resolve();

      // Tag giornaliero: se arrivano più push con lo stesso tag nello stesso giorno
      // (es. operatore con 2 subscription), la seconda rimpiazza la prima senza
      // rifare il suono/vibrazione (renotify: false), evitando il flash immediato.
      const today = new Date().toISOString().slice(0, 10);
      return self.registration.showNotification(data.title, {
        body:               data.body || '',
        icon:               '/icons/icon-192.png',
        badge:              '/icons/icon-192.png',
        requireInteraction: true,
        tag:                `m361-${today}`,
        renotify:           false,
        data:               { url: data.url },
      });
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
