import { BarChart3, CalendarCheck2, Euro, Star, TrendingUp, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ReservationsChart, type PointJournalier } from "@/components/dashboard/reservations-chart";
import { formatPrix } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

function StatTile({
  icon: Icon,
  label,
  valeur,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  valeur: string;
  detail?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className="size-4 text-brand" /> {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{valeur}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </Card>
  );
}

export default async function StatistiquesPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const debut30j = new Date();
  debut30j.setDate(debut30j.getDate() - 29);
  debut30j.setHours(0, 0, 0, 0);

  const [{ data: rdvsMois }, { data: rdvs30j }, { count: nombreNouveauxClients }, { data: avis }] =
    await Promise.all([
      supabase
        .from("rendez_vous")
        .select("statut, debut, prestations(prix_cents)")
        .eq("entreprise_id", entreprise.id)
        .gte("debut", debutMois.toISOString()),
      supabase
        .from("rendez_vous")
        .select("debut, statut")
        .eq("entreprise_id", entreprise.id)
        .in("statut", ["confirme", "honore"])
        .gte("debut", debut30j.toISOString()),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("entreprise_id", entreprise.id)
        .gte("created_at", debutMois.toISOString()),
      supabase.from("avis").select("note").eq("entreprise_id", entreprise.id),
    ]);

  const honores = (rdvsMois ?? []).filter((r) => r.statut === "honore");
  const absents = (rdvsMois ?? []).filter((r) => r.statut === "absent");
  const caMois = honores.reduce((acc, r) => acc + (r.prestations?.prix_cents ?? 0), 0);
  const totalRdvMois = (rdvsMois ?? []).filter((r) =>
    ["confirme", "honore", "absent"].includes(r.statut),
  ).length;
  const tauxPresence =
    honores.length + absents.length > 0
      ? Math.round((honores.length / (honores.length + absents.length)) * 100)
      : null;
  const noteMoyenne =
    avis && avis.length > 0 ? avis.reduce((acc, a) => acc + a.note, 0) / avis.length : null;

  const points: PointJournalier[] = [];
  for (let i = 0; i < 30; i++) {
    const jour = new Date(debut30j);
    jour.setDate(jour.getDate() + i);
    const cle = jour.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
    const total = (rdvs30j ?? []).filter(
      (r) => new Date(r.debut).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }) === cle,
    ).length;
    points.push({
      date: cle,
      label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(jour),
      total,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Statistiques</h1>
        <p className="mt-1 text-muted">Le mois en cours pour {entreprise.nom}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={Euro} label="Chiffre d'affaires du mois" valeur={formatPrix(caMois)} />
        <StatTile icon={CalendarCheck2} label="Rendez-vous du mois" valeur={String(totalRdvMois)} />
        <StatTile
          icon={TrendingUp}
          label="Taux de présence"
          valeur={tauxPresence !== null ? `${tauxPresence}%` : "—"}
          detail="honorés vs. absents"
        />
        <StatTile
          icon={Star}
          label="Note moyenne"
          valeur={noteMoyenne !== null ? `${noteMoyenne.toFixed(1)}/5` : "—"}
          detail={avis ? `${avis.length} avis au total` : undefined}
        />
        <StatTile
          icon={UserPlus}
          label="Nouveaux clients"
          valeur={String(nombreNouveauxClients ?? 0)}
          detail="ce mois-ci"
        />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <BarChart3 className="size-4 text-brand" />
          Réservations confirmées — 30 derniers jours
        </div>
        <ReservationsChart points={points} />
      </Card>
    </div>
  );
}
