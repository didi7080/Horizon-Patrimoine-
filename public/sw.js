// Service worker minimal pour la consultation hors connexion de "Ma journée".
// Portée volontairement restreinte : on ne met en cache ni les données
// sensibles, ni le reste du tableau de bord — seulement ce qu'il faut pour
// qu'un salarié puisse consulter son planning du jour sans réseau.
const VERSION = "ardv-offline-v1";
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

  if (request.mode === "navigate") {
    event.respondWith(gererNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheSinonReseau(request, CACHE_STATIQUE));
  }
});

async function gererNavigation(request) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE_PAGES);

  try {
    const reponse = await fetch(request);
    if (reponse && reponse.ok && url.pathname === PAGE_HORS_CONNEXION) {
      cache.put(PAGE_HORS_CONNEXION, reponse.clone());
    }
    return reponse;
  } catch {
    // Hors connexion : on sert en priorité la page exacte demandée si elle a
    // déjà été mise en cache, sinon on retombe sur "Ma journée" (seule page
    // conçue pour être lue sans réseau) pour éviter l'écran d'erreur natif.
    const enCache = (await cache.match(url.pathname)) ?? (await cache.match(PAGE_HORS_CONNEXION));
    if (enCache) return enCache;
    throw new Error("hors-connexion-sans-cache");
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
