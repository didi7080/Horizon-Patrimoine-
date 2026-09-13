"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "16px",
            background: "#f8fafc",
            color: "#0f172a",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>ArtisanRDV est momentanément indisponible</h1>
          <p style={{ marginTop: "8px", color: "#64748b", maxWidth: "360px" }}>
            Une erreur inattendue est survenue. Merci de réessayer dans quelques instants.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "20px",
              background: "#1d6f5c",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
