<<<<<<< Updated upstream
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("simple-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
=======
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
>>>>>>> Stashed changes
});
