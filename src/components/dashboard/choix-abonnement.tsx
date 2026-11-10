"use client";

import { useState } from "react";
import { AbonnementBouton } from "@/components/dashboard/abonnement-bouton";
import { formatPrix } from "@/lib/utils";
import type { Intervalle, Plan } from "@/lib/stripe";

export function ChoixAbonnement({
  plan,
  nomPlanAffiche,
  prixMensuelCents,
  prixAnnuelCents,
}: {
  plan: Plan;
  nomPlanAffiche: string;
  prixMensuelCents: number | null;
  prixAnnuelCents: number | null;
}) {
  const [intervalle, setIntervalle] = useState<Intervalle>("mois");

  if (!prixAnnuelCents) {
    return (
      <AbonnementBouton action="demarrer" plan={plan} size="sm">
        Passer à la formule {nomPlanAffiche}
      </AbonnementBouton>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border-strong p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setIntervalle("mois")}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            intervalle === "mois" ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setIntervalle("annee")}
          className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
            intervalle === "annee" ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Annuel (2 mois offerts)
        </button>
      </div>
      <AbonnementBouton action="demarrer" plan={plan} intervalle={intervalle} size="sm">
        Passer à la formule {nomPlanAffiche}
        {intervalle === "annee" && prixAnnuelCents ? ` — ${formatPrix(prixAnnuelCents)}/an` : ""}
        {intervalle === "mois" && prixMensuelCents ? ` — ${formatPrix(prixMensuelCents)}/mois` : ""}
      </AbonnementBouton>
    </div>
  );
}
