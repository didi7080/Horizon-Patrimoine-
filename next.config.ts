import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Le reste du site ne doit pas pouvoir être intégré dans un iframe tiers
        // (protection contre le clickjacking).
        source: "/((?!embed).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Les pages /embed sont conçues pour être intégrées sur le site de
        // n'importe quel client ArtisanRDV : l'exception est volontaire.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Le navigateur doit revérifier le service worker à chaque chargement
        // pour que les mises à jour (nouvelles versions de cache) soient prises
        // en compte rapidement.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
