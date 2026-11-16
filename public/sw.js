// Service worker minimal pour la consultation hors connexion de "Ma journée".
// Portée volontairement restreinte : on ne met en cache ni les données
// sensibles, ni le reste du tableau de bord — seulement ce qu'il faut pour
// qu'un salarié puisse consulter son planning du jour sans réseau.
const VERSION = "ardv-offline-v2";
const CACHE_PAGES = `${VERSION}-pages`;
const CACHE_STATIQUE = `${VERSION}-statique`;
const PAGE_HORS_CONNEXION = "/dashboard/ma-journee";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom.startsWith("ardv-offline-") && !nom.startsWith(VERSION))
          .map((nom) => caches.delete(nom)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // On ne sert depuis le cache que la navigation exacte vers "Ma journée" :
  // servir cette page en réponse à une AUTRE URL perturbe l'hydratation
  // côté client de Next.js (le routeur détecte l'écart avec l'URL réelle).
  // Pour toute autre page, on laisse le comportement réseau normal.
  if (request.mode === "navigate" && url.pathname === PAGE_HORS_CONNEXION) {
    event.respondWith(gererNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheSinonReseau(request, CACHE_STATIQUE));
  }
});

async function gererNavigation(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const reponse = await fetch(request);
    if (reponse && reponse.ok) await cache.put(request, reponse.clone());
    return reponse;
  } catch (erreur) {
    const enCache = await cache.match(request);
    if (enCache) return enCache;
    throw erreur;
  }
}

async function cacheSinonReseau(request, nomCache) {
  const cache = await caches.open(nomCache);
  const enCache = await cache.match(request);
  if (enCache) return enCache;
  const reponse = await fetch(request);
  if (reponse && reponse.ok) cache.put(request, reponse.clone());
  return reponse;
}

self.addEventListener("push", (event) => {
  let donnees = { title: "ArtisanRDV", body: "Nouvelle notification." };
  try {
    if (event.data) donnees = { ...donnees, ...event.data.json() };
  } catch {
    // Charge utile non-JSON : on garde le message par défaut.
  }

  event.waitUntil(
    self.registration.showNotification(donnees.title, {
      body: donnees.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: donnees.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
