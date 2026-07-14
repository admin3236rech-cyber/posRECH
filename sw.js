const CACHE_NAME = "emi-pos-v2";

const ARCHIVOS_APP = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo-emi.png"
];

// Instalar y guardar la estructura principal.
self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS_APP))
      .then(() => self.skipWaiting())
  );
});

// Eliminar cachés anteriores.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(nombres =>
        Promise.all(
          nombres
            .filter(nombre => nombre !== CACHE_NAME)
            .map(nombre => caches.delete(nombre))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Cargar red primero y usar caché si falla.
self.addEventListener("fetch", event => {
  const solicitud = event.request;

  if (solicitud.method !== "GET") return;

  event.respondWith(
    fetch(solicitud)
      .then(respuesta => {
        const copia = respuesta.clone();

        caches
          .open(CACHE_NAME)
          .then(cache => cache.put(solicitud, copia))
          .catch(() => {});

        return respuesta;
      })
      .catch(() =>
        caches.match(solicitud).then(respuestaCache => {
          if (respuestaCache) {
            return respuestaCache;
          }

          if (solicitud.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response("", {
            status: 503,
            statusText: "Sin conexión"
          });
        })
      )
  );
});
