"use client";

import { useId, useState } from "react";

export type PointJournalier = { date: string; label: string; total: number };

const HAUTEUR = 160;
const LARGEUR_BARRE = 18;
const ESPACE = 6;

export function ReservationsChart({ points }: { points: PointJournalier[] }) {
  const [survole, setSurvole] = useState<number | null>(null);
  const idTitre = useId();

  const max = Math.max(1, ...points.map((p) => p.total));
  const largeur = points.length * (LARGEUR_BARRE + ESPACE);

  return (
    <div className="relative">
      <svg
        role="img"
        aria-labelledby={idTitre}
        viewBox={`0 0 ${largeur} ${HAUTEUR + 24}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
      >
        <title id={idTitre}>Nombre de rendez-vous confirmés par jour sur les 30 derniers jours</title>
        {/* ligne de base */}
        <line x1={0} y1={HAUTEUR} x2={largeur} y2={HAUTEUR} stroke="var(--border)" strokeWidth={1} />
        {points.map((p, i) => {
          const h = p.total === 0 ? 0 : Math.max(3, (p.total / max) * (HAUTEUR - 8));
          const x = i * (LARGEUR_BARRE + ESPACE);
          const y = HAUTEUR - h;
          const actif = survole === i;
          return (
            <g key={p.date}>
              <rect
                x={x}
                y={y}
                width={LARGEUR_BARRE}
                height={h}
                rx={4}
                fill={actif ? "var(--brand-dark)" : "var(--brand)"}
                onMouseEnter={() => setSurvole(i)}
                onMouseLeave={() => setSurvole(null)}
                className="cursor-pointer transition-colors"
              />
              {i % 5 === 0 && (
                <text
                  x={x + LARGEUR_BARRE / 2}
                  y={HAUTEUR + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--muted-foreground)"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {survole !== null && (
        <div
          className="pointer-events-none absolute rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
          style={{
            left: `${((survole * (LARGEUR_BARRE + ESPACE) + LARGEUR_BARRE / 2) / largeur) * 100}%`,
            top: 0,
            transform: "translate(-50%, -100%)",
          }}
        >
          {points[survole].label} · {points[survole].total} RDV
        </div>
      )}

      <table className="sr-only">
        <caption>Rendez-vous confirmés par jour</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Rendez-vous</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{p.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
