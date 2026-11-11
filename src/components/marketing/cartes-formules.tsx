"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { REDUCTION_ANNUELLE_POURCENT } from "@/lib/stripe";

type Formule = {
  nom: string;
  description: string;
  prixMois: number;
  prixAn: number;
  option?: boolean;
  misEnAvant: boolean;
  inclus: readonly string[];
};

export function CartesFormules({ formules }: { formules: readonly Formule[] }) {
  const [annuel, setAnnuel] = useState(false);

  return (
    <div>
      <div className="mx-auto flex w-fit items-center gap-1 rounded-lg border border-border-strong p-1 text-sm">
        <button
          type="button"
          onClick={() => setAnnuel(false)}
          className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
            !annuel ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Mensuel
        </button>
        <button
          type="button"
          onClick={() => setAnnuel(true)}
          className={`rounded-md px-4 py-1.5 font-medium transition-colors ${
            annuel ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          Annuel <span className="ml-1 text-xs opacity-80">(-{REDUCTION_ANNUELLE_POURCENT}%)</span>
        </button>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {formules.map((formule) => {
          const prixAffiche = annuel ? formule.prixAn : formule.prixMois;
          const prefixe = formule.option ? "+" : "";
          return (
            <Card
              key={formule.nom}
              className={"p-8 text-center" + (formule.misEnAvant ? " border-brand/30 shadow-lg shadow-slate-900/5" : "")}
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">{formule.nom}</p>
              <p className="mt-3 flex items-end justify-center gap-1">
                <span className="text-5xl font-semibold text-foreground">
                  {prefixe}
                  {prixAffiche}€
                </span>
                <span className="pb-1.5 text-muted">{annuel ? "/ an HT" : "/ mois HT"}</span>
              </p>
              {annuel && (
                <p className="mt-1 text-xs text-success">
                  Soit {prefixe}
                  {(formule.prixAn / 12).toFixed(2)}€/mois, -{REDUCTION_ANNUELLE_POURCENT}%
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{formule.description}</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/inscription">
                  Démarrer l’essai gratuit <ArrowRight className="size-4" />
                </Link>
              </Button>
              <ul className="mt-8 space-y-3 text-left text-sm">
                {formule.inclus.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
