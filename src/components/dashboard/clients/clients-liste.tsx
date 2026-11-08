"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientRow } from "@/components/dashboard/client-row";
import type { Tables } from "@/lib/types/database";

export function ClientsListe({
  clients,
  nbRdvParClient,
}: {
  clients: Tables<"clients">[];
  nbRdvParClient: Record<string, number>;
}) {
  const [recherche, setRecherche] = useState("");

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.nom} ${c.email ?? ""} ${c.telephone ?? ""}`.toLowerCase().includes(q));
  }, [clients, recherche]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un client (nom, e-mail, téléphone...)"
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtres.length > 0 ? (
          filtres.map((c) => <ClientRow key={c.id} client={c} nbRdv={nbRdvParClient[c.id] ?? 0} />)
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            {clients.length === 0 ? "Vos clients apparaîtront ici après leur première réservation." : "Aucun client ne correspond à cette recherche."}
          </Card>
        )}
      </div>
    </div>
  );
}
