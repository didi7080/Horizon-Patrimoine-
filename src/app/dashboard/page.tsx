import { CalendarClock, Inbox } from "lucide-react";
import { RdvRow, type RdvAvecRelations } from "@/components/dashboard/rdv-row";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function DashboardPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

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
