"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrix, formatDateCourte } from "@/lib/utils";
import { filtrerHistorique, type EntreeHistorique, type FiltresHistorique } from "@/lib/clients/historique";

const TYPES: { value: NonNullable<FiltresHistorique["type"]>; label: string }[] = [
  { value: "tous", label: "Tous les types" },
  { value: "devis", label: "Devis" },
  { value: "facture", label: "Factures" },
  { value: "rendez_vous", label: "Rendez-vous" },
];

export function HistoriqueClient({ clientId, entrees }: { clientId: string; entrees: EntreeHistorique[] }) {
  const [q, setQ] = useState("");
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [type, setType] = useState<NonNullable<FiltresHistorique["type"]>>("tous");

  const filtrees = useMemo(() => filtrerHistorique(entrees, { q, debut, fin, type }), [entrees, q, debut, fin, type]);

  const urlExport = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (debut) params.set("debut", debut);
    if (fin) params.set("fin", fin);
    if (type !== "tous") params.set("type", type);
    const qs = params.toString();
    return `/api/export/clients/${clientId}/historique${qs ? `?${qs}` : ""}`;
  }, [clientId, q, debut, fin, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (ex. chaudière, radiateur, numéro...)"
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          className="sm:w-36"
          aria-label="Depuis le"
        />
        <Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="sm:w-36" aria-label="Jusqu'au" />
        <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button asChild variant="outline" size="sm">
          <a href={urlExport}>
            <Download className="size-3.5" /> Exporter
          </a>
        </Button>
      </div>

      {filtrees.length > 0 ? (
        <div className="space-y-2">
          {filtrees.map((e) => (
            <EntreeHistoriqueCard key={`${e.type}-${e.id}`} entree={e} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted">
          {entrees.length === 0
            ? "Aucun devis, facture ou rendez-vous pour ce client pour le moment."
            : "Aucun résultat pour ces filtres."}
        </Card>
      )}
    </div>
  );
}

function EntreeHistoriqueCard({ entree }: { entree: EntreeHistorique }) {
  const contenu = (
    <Card
      className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
        entree.lienHref ? "transition-colors hover:border-brand" : ""
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{entree.reference}</p>
          <Badge variant={entree.statutVariant}>{entree.statutLabel}</Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted">
          {formatDateCourte(entree.date)}
          {entree.detail ? ` · ${entree.detail}` : ""}
        </p>
      </div>
      {entree.montantTTC !== null && <p className="shrink-0 text-sm font-medium text-foreground">{formatPrix(entree.montantTTC)}</p>}
    </Card>
  );
  return entree.lienHref ? <Link href={entree.lienHref}>{contenu}</Link> : contenu;
}
