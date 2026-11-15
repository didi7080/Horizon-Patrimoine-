"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { ajouterParticipantRdv, retirerParticipantRdv } from "@/app/dashboard/actions";

type Salarie = { id: string; nom: string; couleur?: string | null };

export function ParticipantsRdv({
  rdvId,
  participants,
  salariesDisponibles,
}: {
  rdvId: string;
  participants: Salarie[];
  salariesDisponibles: Salarie[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [pending, startTransition] = useTransition();

  const idsDejaLa = new Set(participants.map((p) => p.id));
  const choix = salariesDisponibles.filter((s) => !idsDejaLa.has(s.id));

  function ajouter(salarieId: string) {
    setOuvert(false);
    startTransition(async () => {
      const resultat = await ajouterParticipantRdv(rdvId, salarieId);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  function retirer(salarieId: string) {
    startTransition(async () => {
      const resultat = await retirerParticipantRdv(rdvId, salarieId);
      if (!resultat.ok) toast.error(resultat.erreur);
    });
  }

  if (participants.length === 0 && choix.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {participants.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-foreground">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: p.couleur ?? "#94a3b8" }} />
          {p.nom} (renfort)
          <button type="button" onClick={() => retirer(p.id)} disabled={pending} className="text-muted hover:text-foreground">
            <X className="size-3" />
          </button>
        </span>
      ))}
      {choix.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOuvert((o) => !o)}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2 py-0.5 text-xs text-muted hover:text-foreground"
          >
            <Plus className="size-3" /> Renfort
          </button>
          {ouvert && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOuvert(false)} />
              <div className="absolute left-0 top-full z-20 mt-1 min-w-32 rounded-lg border border-border bg-background py-1 shadow-lg">
                {choix.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => ajouter(s.id)}
                    className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-surface"
                  >
                    {s.nom}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
