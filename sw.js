// Legacy SW — auto-unregister, sostituito da service-worker.js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e =>
  e.waitUntil(self.registration.unregister())
);
