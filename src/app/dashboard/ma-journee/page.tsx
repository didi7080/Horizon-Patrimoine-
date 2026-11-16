import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatutBadge } from "@/components/statut-badge";
import { PhotosIntervention } from "@/components/dashboard/photos-intervention";
import { BoutonHorsConnexion } from "@/components/dashboard/bouton-hors-connexion";
import { BanniereHorsConnexion } from "@/components/dashboard/banniere-hors-connexion";
import { changerStatutRdv } from "@/app/dashboard/actions";
import { parisVersIso } from "@/lib/assistant/outils";
import { formatHeure } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types/database";

export const revalidate = 0;

type RdvJournee = Pick<Tables<"rendez_vous">, "id" | "debut" | "fin" | "statut" | "notes" | "adresse_client"> & {
  prestations: Pick<Tables<"prestations">, "nom" | "urgence_active"> | null;
  salaries: Pick<Tables<"salaries">, "nom" | "couleur"> | null;
  clients: Pick<Tables<"clients">, "nom" | "telephone"> | null;
  photos_intervention: { id: string }[];
};

function dateDuJourParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

export default async function MaJourneePage() {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: monSalarie } = await supabase
    .from("salaries")
    .select("id, nom")
    .eq("entreprise_id", entreprise.id)
    .eq("profile_id", userId)
    .maybeSingle();

  const aujourdhui = dateDuJourParis();
  const debutIso = parisVersIso(aujourdhui, "00:00");
  const finIso = parisVersIso(aujourdhui, "23:59");
  const selectRdv =
    "id, debut, fin, statut, notes, adresse_client, prestations(nom, urgence_active), salaries!rendez_vous_salarie_id_fkey(nom, couleur), clients(nom, telephone), photos_intervention(id)";

  let rdvs: RdvJournee[];
  if (monSalarie) {
    const [{ data: aTitrePrincipal }, { data: participations }] = await Promise.all([
      supabase
        .from("rendez_vous")
        .select(selectRdv)
        .eq("entreprise_id", entreprise.id)
        .eq("salarie_id", monSalarie.id)
        .in("statut", ["confirme", "honore", "absent"])
        .gte("debut", debutIso)
        .lte("debut", finIso),
      supabase
        .from("rendez_vous_participants")
        .select(`rendez_vous:rendez_vous_id(${selectRdv})`)
        .eq("salarie_id", monSalarie.id),
    ]);
    const depuisParticipations = (participations ?? [])
      .map((p) => p.rendez_vous as unknown as RdvJournee | null)
      .filter((r): r is RdvJournee => r !== null && ["confirme", "honore", "absent"].includes(r.statut) && r.debut >= debutIso && r.debut <= finIso);

    const parId = new Map<string, RdvJournee>();
    for (const r of [...(aTitrePrincipal ?? []), ...depuisParticipations]) parId.set(r.id, r);
    rdvs = [...parId.values()].sort((a, b) => a.debut.localeCompare(b.debut));
  } else {
    const { data } = await supabase
      .from("rendez_vous")
      .select(selectRdv)
      .eq("entreprise_id", entreprise.id)
      .in("statut", ["confirme", "honore", "absent"])
      .gte("debut", debutIso)
      .lte("debut", finIso)
      .order("debut");
    rdvs = (data ?? []) as RdvJournee[];
  }

  const libelleJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(
    new Date(),
  );
  const derniereSynchro = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date());

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <BanniereHorsConnexion derniereSynchro={derniereSynchro} />

      <div>
        <h1 className="text-2xl font-semibold capitalize text-foreground">{libelleJour}</h1>
        <p className="mt-1 text-muted">
          {monSalarie ? `Vos interventions du jour, ${monSalarie.nom}.` : "Les interventions de l'équipe aujourd'hui."}
        </p>
      </div>

      {rdvs.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">Aucune intervention prévue aujourd’hui.</Card>
      ) : (
        <div className="space-y-3">
          {rdvs.map((rdv) => {
            const passe = rdv.statut !== "annule" && new Date(rdv.fin) < new Date();
            const mapsUrl = rdv.adresse_client
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rdv.adresse_client)}`
              : null;
            return (
              <Card key={rdv.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatHeure(rdv.debut)}</p>
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <span>{rdv.prestations?.nom ?? "Rendez-vous"}</span>
                      {rdv.prestations?.urgence_active && <Badge variant="danger">🚨 Urgence</Badge>}
                    </p>
                    <p className="text-muted">{rdv.clients?.nom ?? "Client"}</p>
                    {!monSalarie && rdv.salaries?.nom && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: rdv.salaries.couleur ?? "#94a3b8" }} />
                        {rdv.salaries.nom}
                      </p>
                    )}
                  </div>
                  <StatutBadge statut={rdv.statut} />
                </div>

                {rdv.notes && <p className="rounded-md bg-surface p-2 text-sm text-foreground">{rdv.notes}</p>}

                <div className="flex flex-wrap gap-2">
                  {rdv.clients?.telephone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${rdv.clients.telephone}`}>
                        <Phone className="size-3.5" /> Appeler
                      </a>
                    </Button>
                  )}
                  {mapsUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="size-3.5" /> Itinéraire
                      </a>
                    </Button>
                  )}
                </div>

                <PhotosIntervention rdvId={rdv.id} nombrePhotos={rdv.photos_intervention.length} modifiable />

                {rdv.statut === "confirme" && passe && (
                  <div className="flex gap-2 border-t border-border pt-3">
                    <form action={async () => { "use server"; await changerStatutRdv(rdv.id, "honore"); }}>
                      <BoutonHorsConnexion size="sm" type="submit">
                        Honoré
                      </BoutonHorsConnexion>
                    </form>
                    <form action={async () => { "use server"; await changerStatutRdv(rdv.id, "absent"); }}>
                      <BoutonHorsConnexion size="sm" variant="outline" type="submit">
                        Client absent
                      </BoutonHorsConnexion>
                    </form>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        <Link href="/dashboard/rendez-vous" className="hover:text-foreground hover:underline">
          Voir tout l’agenda
        </Link>
      </p>
    </div>
  );
}
