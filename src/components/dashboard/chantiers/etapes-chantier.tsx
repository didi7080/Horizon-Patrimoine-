"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ajouterEtape, basculerEtape, supprimerEtape } from "@/app/dashboard/chantiers/actions";
import type { Tables } from "@/lib/types/database";

export function EtapesChantier({
  chantierId,
  etapes,
}: {
  chantierId: string;
  etapes: Tables<"etapes_chantier">[];
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nouvelleEtape, setNouvelleEtape] = useState("");

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!nouvelleEtape.trim()) return;
    startTransition(async () => {
      const resultat = await ajouterEtape(chantierId, nouvelleEtape);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setNouvelleEtape("");
      inputRef.current?.focus();
    });
  }

  function basculer(etapeId: string, fait: boolean) {
    startTransition(async () => {
      const resultat = await basculerEtape(etapeId, chantierId, fait);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  function supprimer(etapeId: string) {
    startTransition(async () => {
      const resultat = await supprimerEtape(etapeId, chantierId);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  const nbFaites = etapes.filter((e) => e.fait).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Étapes</p>
        {etapes.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {nbFaites}/{etapes.length} faites
          </p>
        )}
      </div>

      {etapes.length === 0 && <p className="text-sm text-muted">Aucune étape pour le moment.</p>}

      <ul className="space-y-1.5">
        {etapes.map((etape) => (
          <li key={etape.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-surface">
            <input
              type="checkbox"
              checked={etape.fait}
              disabled={pending}
              onChange={(e) => basculer(etape.id, e.target.checked)}
              className="size-4 accent-brand"
            />
            <span className={etape.fait ? "flex-1 text-sm text-muted line-through" : "flex-1 text-sm text-foreground"}>
              {etape.titre}
            </span>
            <button
              type="button"
              onClick={() => supprimer(etape.id)}
              disabled={pending}
              className="text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={ajouter} className="flex gap-2">
        <Input
          ref={inputRef}
          value={nouvelleEtape}
          onChange={(e) => setNouvelleEtape(e.target.value)}
          placeholder="Ajouter une étape…"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !nouvelleEtape.trim()}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        </Button>
      </form>
    </div>
  );
}
