import Link from "next/link";
import { AlertTriangle, CalendarClock, Inbox } from "lucide-react";
import { RdvRow, type RdvAvecRelations } from "@/components/dashboard/rdv-row";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";

export const revalidate = 0;

export default async function DashboardPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const maintenant = new Date();
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);

  const selectRdv =
    "*, prestations(nom), salaries(nom, couleur), clients(nom, telephone)";

  const [
    { data: demandes },
    { data: rdvAujourdhui },
    { count: nbPrestations },
    { count: nbHoraires },
    { data: facturesEnRetard },
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select(selectRdv)
      .eq("entreprise_id", entreprise.id)
      .eq("statut", "demande")
      .order("debut"),
    supabase
      .from("rendez_vous")
      .select(selectRdv)
      .eq("entreprise_id", entreprise.id)
      .in("statut", ["confirme", "honore", "absent"])
      .gte("debut", debutJour.toISOString())
      .lte("debut", finJour.toISOString())
      .order("debut"),
    supabase
      .from("prestations")
      .select("id", { count: "exact", head: true })
      .eq("entreprise_id", entreprise.id),
    supabase
      .from("horaires")
      .select("id, salaries!inner(entreprise_id)", { count: "exact", head: true })
      .eq("salaries.entreprise_id", entreprise.id),
    supabase
      .from("documents")
      .select("id, numero, client_nom, date_echeance, lignes")
      .eq("entreprise_id", entreprise.id)
      .eq("type", "facture")
      .eq("statut", "envoyee")
      .lt("date_echeance", maintenant.toISOString().slice(0, 10))
      .order("date_echeance"),
  ]);

  const etapesOnboarding = [
    { label: "Ajouter au moins une prestation", fait: (nbPrestations ?? 0) > 0, href: "/dashboard/prestations" },
    { label: "Définir les horaires de votre équipe", fait: (nbHoraires ?? 0) > 0, href: "/dashboard/equipe" },
    {
      label: "Personnaliser votre page (description, couleur)",
      fait: Boolean(entreprise.description),
      href: "/dashboard/reglages",
    },
  ];

  const aujourdhui = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold capitalize text-foreground">{aujourdhui}</h1>
        <p className="mt-1 text-muted">Vue du jour pour {entreprise.nom}.</p>
      </div>

      <OnboardingChecklist etapes={etapesOnboarding} />

      {demandes && demandes.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-warning">
            <Inbox className="size-4" /> Demandes à valider ({demandes.length})
          </h2>
          <div className="space-y-2">
            {(demandes as RdvAvecRelations[]).map((rdv) => (
              <RdvRow key={rdv.id} rdv={rdv} />
            ))}
          </div>
        </section>
      )}

      {facturesEnRetard && facturesEnRetard.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-danger">
            <AlertTriangle className="size-4" /> Factures en retard de paiement ({facturesEnRetard.length})
          </h2>
          <div className="space-y-2">
            {facturesEnRetard.map((f) => {
              const totaux = calculerTotaux((f.lignes as LigneDocument[] | null) ?? []);
              const joursRetard = Math.floor(
                (maintenant.getTime() - new Date(`${f.date_echeance}T00:00:00`).getTime()) / 86_400_000,
              );
              return (
                <Link key={f.id} href={`/dashboard/documents/${f.id}`}>
                  <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand">
                    <div>
                      <p className="font-medium text-foreground">
                        {f.numero} · {f.client_nom}
                      </p>
                      <p className="text-sm text-muted">
                        En retard de {joursRetard} jour{joursRetard > 1 ? "s" : ""} · échéance le{" "}
                        {formatDateCourte(f.date_echeance!)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-foreground">{formatPrix(totaux.totalTTC)}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarClock className="size-4" /> Aujourd’hui ({rdvAujourdhui?.length ?? 0})
        </h2>
        {rdvAujourdhui && rdvAujourdhui.length > 0 ? (
          <div className="space-y-2">
            {(rdvAujourdhui as RdvAvecRelations[]).map((rdv) => (
              <RdvRow key={rdv.id} rdv={rdv} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-sm text-muted">
            Aucun rendez-vous prévu aujourd’hui.
          </Card>
        )}
      </section>
    </div>
  );
}
