"use client";

import { WifiOff } from "lucide-react";
import { useHorsConnexion } from "@/lib/hooks/hors-connexion";

export function BanniereHorsConnexion({ derniereSynchro }: { derniereSynchro: string }) {
  const horsConnexion = useHorsConnexion();
  if (!horsConnexion) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <WifiOff className="size-4 shrink-0" />
      <p>
        Vous êtes hors connexion. Affichage des données du {derniereSynchro}. Les actions (statut, photos)
        reviendront au retour du réseau.
      </p>
    </div>
  );
}
