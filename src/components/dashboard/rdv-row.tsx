import { Check, X, MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatutBadge } from "@/components/statut-badge";
import { formatHeure, formatDateCourte } from "@/lib/utils";
import { validerDemande, changerStatutRdv } from "@/app/dashboard/actions";
import type { Tables } from "@/lib/types/database";

export type RdvAvecRelations = Tables<"rendez_vous"> & {
  prestations: Pick<Tables<"prestations">, "nom"> | null;
  salaries: Pick<Tables<"salaries">, "nom" | "couleur"> | null;
  clients: Pick<Tables<"clients">, "nom" | "telephone"> | null;
};

export function RdvRow({ rdv, showDate = false }: { rdv: RdvAvecRelations; showDate?: boolean }) {
  const enAttente = rdv.statut === "demande";
  const passe = new Date(rdv.debut) < new Date();

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: rdv.salaries?.couleur ?? "#94a3b8" }}
        />
        <div>
          <p className="font-medium text-foreground">
            {showDate ? `${formatDateCourte(rdv.debut)} · ` : ""}
            {formatHeure(rdv.debut)} — {rdv.prestations?.nom ?? "Rendez-vous"}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            <span>{rdv.clients?.nom ?? "Client"}</span>
            {rdv.clients?.telephone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {rdv.clients.telephone}
              </span>
            )}
            {rdv.salaries?.nom && <span>· {rdv.salaries.nom}</span>}
            {rdv.adresse_client && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {rdv.adresse_client}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {enAttente ? (
          <>
            <form action={validerDemande.bind(null, rdv.id, true)}>
              <Button size="sm" type="submit">
                <Check className="size-3.5" /> Accepter
              </Button>
            </form>
            <form action={validerDemande.bind(null, rdv.id, false)}>
              <Button size="sm" variant="outline" type="submit">
                <X className="size-3.5" /> Refuser
              </Button>
            </form>
          </>
        ) : (
          <>
            <StatutBadge statut={rdv.statut} />
            {rdv.statut === "confirme" && passe && (
              <div className="flex gap-1">
                <form action={changerStatutRdv.bind(null, rdv.id, "honore")}>
                  <Button size="sm" variant="subtle" type="submit">
                    Honoré
                  </Button>
                </form>
                <form action={changerStatutRdv.bind(null, rdv.id, "absent")}>
                  <Button size="sm" variant="outline" type="submit">
                    Absent
                  </Button>
                </form>
              </div>
            )}
            {rdv.statut === "confirme" && !passe && (
              <form action={changerStatutRdv.bind(null, rdv.id, "annule")}>
                <Button size="sm" variant="ghost" type="submit">
                  Annuler
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
