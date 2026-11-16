"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changerStatutChantier } from "@/app/dashboard/chantiers/actions";

const OPTIONS = [
  { valeur: "en_cours" as const, label: "En cours" },
  { valeur: "termine" as const, label: "Terminé" },
  { valeur: "annule" as const, label: "Annulé" },
];

export function StatutChantierBoutons({
  chantierId,
  statutActuel,
}: {
  chantierId: string;
  statutActuel: string;
}) {
  const [pending, startTransition] = useTransition();

  function changer(statut: "en_cours" | "termine" | "annule") {
    if (statut === statutActuel) return;
    startTransition(async () => {
      const resultat = await changerStatutChantier(chantierId, statut);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.valeur}
          type="button"
          size="sm"
          variant={option.valeur === statutActuel ? "default" : "outline"}
          disabled={pending}
          onClick={() => changer(option.valeur)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
