"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nomJour } from "@/lib/utils";
import { ajouterHoraire, supprimerHoraire } from "@/app/dashboard/actions";
import type { Tables } from "@/lib/types/database";

export function HorairesEditor({
  salarieId,
  horaires,
}: {
  salarieId: string;
  horaires: Tables<"horaires">[];
}) {
  const [ajoutJour, setAjoutJour] = useState<number | null>(null);
  const [debut, setDebut] = useState("09:00");
  const [fin, setFin] = useState("18:00");
  const [pending, startTransition] = useTransition();

  function confirmerAjout(jour: number) {
    startTransition(async () => {
      try {
        await ajouterHoraire(salarieId, jour, debut, fin);
        setAjoutJour(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  function retirer(id: string) {
    startTransition(async () => {
      try {
        await supprimerHoraire(id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <div className="space-y-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((jour) => {
        const horairesDuJour = horaires.filter((h) => h.jour === jour);
        return (
          <div key={jour} className="flex flex-wrap items-center gap-2 py-1 text-sm">
            <span className="w-20 shrink-0 text-muted-foreground">{nomJour(jour)}</span>
            {horairesDuJour.map((h) => (
              <span
                key={h.id}
                className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-foreground"
              >
                {h.debut.slice(0, 5)}–{h.fin.slice(0, 5)}
                <button onClick={() => retirer(h.id)} aria-label="Supprimer" disabled={pending}>
                  <X className="size-3.5 text-muted-foreground hover:text-danger" />
                </button>
              </span>
            ))}
            {ajoutJour === jour ? (
              <span className="inline-flex items-center gap-1">
                <Input
                  type="time"
                  value={debut}
                  onChange={(e) => setDebut(e.target.value)}
                  className="h-8 w-24 px-2 text-xs"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="h-8 w-24 px-2 text-xs"
                />
                <Button size="sm" className="h-8" onClick={() => confirmerAjout(jour)} disabled={pending}>
                  {pending ? <Loader2 className="size-3.5 animate-spin" /> : "OK"}
                </Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setAjoutJour(null)}>
                  Annuler
                </Button>
              </span>
            ) : (
              <button
                onClick={() => setAjoutJour(jour)}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-brand"
              >
                <Plus className="size-3.5" /> Ajouter
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
