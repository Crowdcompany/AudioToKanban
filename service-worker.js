const CACHE_NAME = 'audiokanban-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.html', 
  '/script.js',
  '/style.css',
  '/manifest.json',
  '/tasks.csv'
];

// Installation - Cache wichtige Dateien
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Dateien werden gecacht');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Alter Cache wird gelöscht:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - Cache-First Strategie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - gebe gecachte Version zurück
        if (response) {
          return response;
        }
        
        // Nicht im Cache - lade vom Netzwerk
        return fetch(event.request).then(response => {
          // Prüfe ob Response gültig ist
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone der Response für Cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Offline Fallback für HTML-Seiten
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background Sync (für zukünftige Features)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background Sync');
    // Hier können später Daten synchronisiert werden
  }
});

// Push Notifications (für zukünftige Features)
self.addEventListener('push', event => {
  const options = {
    body: 'Neue AudioKanban Benachrichtigung',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  event.waitUntil(
    self.registration.showNotification('AudioKanban', options)
  );
});