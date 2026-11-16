import Link from "next/link";
import { Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateCourte } from "@/lib/utils";
import { LABEL_STATUT_CHANTIER, joursRestants } from "@/lib/chantiers/utils";

export function ChantierCarte({
  chantier,
  afficherClient = true,
}: {
  chantier: {
    id: string;
    titre: string;
    statut: string;
    date_fin_prevue: string | null;
    clients?: { nom: string } | null;
    etapes_chantier: { fait: boolean }[];
  };
  afficherClient?: boolean;
}) {
  const etapes = chantier.etapes_chantier;
  const nbFaites = etapes.filter((e) => e.fait).length;
  const progression = etapes.length > 0 ? Math.round((nbFaites / etapes.length) * 100) : null;
  const echeance = joursRestants(chantier.date_fin_prevue);
  const statut = LABEL_STATUT_CHANTIER[chantier.statut] ?? { label: chantier.statut, variant: "neutral" as const };

  return (
    <Link href={`/dashboard/chantiers/${chantier.id}`}>
      <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-brand sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Hammer className="size-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">{chantier.titre}</p>
            {afficherClient && <p className="text-sm text-muted">{chantier.clients?.nom ?? "Client"}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {progression !== null && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progression}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {nbFaites}/{etapes.length}
              </span>
            </div>
          )}
          {echeance && chantier.statut === "en_cours" && (
            <Badge variant={echeance.urgent ? "danger" : "neutral"}>{echeance.label}</Badge>
          )}
          {chantier.date_fin_prevue && (
            <span className="text-sm text-muted-foreground">{formatDateCourte(chantier.date_fin_prevue)}</span>
          )}
          <Badge variant={statut.variant}>{statut.label}</Badge>
        </div>
      </Card>
    </Link>
  );
}
