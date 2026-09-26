import { Building2, CalendarCheck2, Euro, TrendingUp, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReservationsChart, type PointJournalier } from "@/components/dashboard/reservations-chart";
import { formatDateCourte, formatPrix } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrixAbonnementCents, planPourEffectif } from "@/lib/stripe";
import type { Enums } from "@/lib/types/database";

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

const ABONNEMENT_CONFIG: Record<
  Enums<"statut_abonnement">,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  actif: { label: "Actif", variant: "success" },
  essai: { label: "Essai", variant: "warning" },
  impaye: { label: "Impayé", variant: "danger" },
  annule: { label: "Annulé", variant: "neutral" },
};

export default async function AdminPage() {
  const supabase = createAdminClient();

  if (!supabase) {
    return (
      <Card className="p-6">
        <p className="font-medium text-foreground">Espace plateforme non disponible</p>
        <p className="mt-1 text-sm text-muted">
          La clé <code>SUPABASE_SERVICE_ROLE_KEY</code> n&apos;est pas configurée sur cet
          environnement.
        </p>
      </Card>
    );
  }

  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const debut30j = new Date();
  debut30j.setDate(debut30j.getDate() - 29);
  debut30j.setHours(0, 0, 0, 0);

  const [
    { data: entreprises },
    { data: abonnements },
    { data: rdvsMois },
    { data: avis },
    prixSoloCents,
    prixEquipeCents,
  ] = await Promise.all([
    supabase
      .from("entreprises")
      .select("id, nom, slug, created_at, nb_salaries")
      .order("created_at", { ascending: false }),
    supabase.from("abonnements").select("entreprise_id, statut, essai_fin"),
    supabase
      .from("rendez_vous")
      .select("entreprise_id, statut, prestations(prix_cents)")
      .gte("debut", debutMois.toISOString()),
    supabase.from("avis").select("entreprise_id, note"),
    getPrixAbonnementCents("solo"),
    getPrixAbonnementCents("equipe"),
  ]);

  const listeEntreprises = entreprises ?? [];
  const abonnementParEntreprise = new Map((abonnements ?? []).map((a) => [a.entreprise_id, a]));

  const parStatut = { actif: 0, essai: 0, impaye: 0, annule: 0 };
  for (const a of abonnements ?? []) parStatut[a.statut]++;

  const nouvellesCeMois = listeEntreprises.filter(
    (e) => new Date(e.created_at) >= debutMois,
  ).length;

  const prixParPlan = { solo: prixSoloCents, equipe: prixEquipeCents };
  let mrrEstimeCents: number | null = 0;
  for (const e of listeEntreprises) {
    if (abonnementParEntreprise.get(e.id)?.statut !== "actif") continue;
    const prix = prixParPlan[planPourEffectif(e.nb_salaries)];
    if (prix === null) {
      mrrEstimeCents = null;
      break;
    }
    mrrEstimeCents += prix;
  }

  const caParEntreprise = new Map<string, number>();
  const rdvParEntreprise = new Map<string, number>();
  let caPlateformeMoisCents = 0;
  for (const r of rdvsMois ?? []) {
    if (r.statut !== "honore" && r.statut !== "confirme" && r.statut !== "absent") continue;
    rdvParEntreprise.set(r.entreprise_id, (rdvParEntreprise.get(r.entreprise_id) ?? 0) + 1);
    if (r.statut === "honore") {
      const prix = r.prestations?.prix_cents ?? 0;
      caParEntreprise.set(r.entreprise_id, (caParEntreprise.get(r.entreprise_id) ?? 0) + prix);
      caPlateformeMoisCents += prix;
    }
  }

  const noteParEntreprise = new Map<string, { total: number; count: number }>();
  for (const a of avis ?? []) {
    const courant = noteParEntreprise.get(a.entreprise_id) ?? { total: 0, count: 0 };
    courant.total += a.note;
    courant.count += 1;
    noteParEntreprise.set(a.entreprise_id, courant);
  }

  const pointsCroissance: PointJournalier[] = [];
  for (let i = 0; i < 30; i++) {
    const jour = new Date(debut30j);
    jour.setDate(jour.getDate() + i);
    const cle = jour.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
    const total = listeEntreprises.filter(
      (e) => new Date(e.created_at).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }) === cle,
    ).length;
    pointsCroissance.push({
      date: cle,
      label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(jour),
      total,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-muted">Toutes les entreprises clientes de la plateforme.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={Building2} label="Entreprises" valeur={String(listeEntreprises.length)} />
        <StatTile
          icon={TrendingUp}
          label="Abonnements actifs"
          valeur={String(parStatut.actif)}
          detail={`${parStatut.essai} en essai · ${parStatut.impaye} impayé(s) · ${parStatut.annule} annulé(s)`}
        />
        <StatTile
          icon={Euro}
          label="MRR estimé"
          valeur={mrrEstimeCents !== null ? formatPrix(mrrEstimeCents) : "—"}
          detail={mrrEstimeCents === null ? "Facturation non configurée" : "abonnements actifs"}
        />
        <StatTile
          icon={Euro}
          label="CA généré via la plateforme"
          valeur={formatPrix(caPlateformeMoisCents)}
          detail="ce mois, chez les entreprises clientes"
        />
        <StatTile icon={UserPlus} label="Nouvelles entreprises" valeur={String(nouvellesCeMois)} detail="ce mois-ci" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarCheck2 className="size-4 text-brand" />
          Nouvelles entreprises — 30 derniers jours
        </div>
        <ReservationsChart points={pointsCroissance} />
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Formule</th>
              <th className="px-4 py-3">Abonnement</th>
              <th className="px-4 py-3">Inscrite le</th>
              <th className="px-4 py-3">RDV ce mois</th>
              <th className="px-4 py-3">CA ce mois</th>
              <th className="px-4 py-3">Note moyenne</th>
            </tr>
          </thead>
          <tbody>
            {listeEntreprises.map((e) => {
              const abonnement = abonnementParEntreprise.get(e.id);
              const note = noteParEntreprise.get(e.id);
              return (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{e.nom}</td>
                  <td className="px-4 py-3 text-muted">
                    {planPourEffectif(e.nb_salaries) === "equipe" ? "Équipe" : "Solo"}
                  </td>
                  <td className="px-4 py-3">
                    {abonnement ? (
                      <Badge variant={ABONNEMENT_CONFIG[abonnement.statut].variant}>
                        {ABONNEMENT_CONFIG[abonnement.statut].label}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDateCourte(e.created_at)}</td>
                  <td className="px-4 py-3 text-muted">{rdvParEntreprise.get(e.id) ?? 0}</td>
                  <td className="px-4 py-3 text-muted">{formatPrix(caParEntreprise.get(e.id) ?? 0)}</td>
                  <td className="px-4 py-3 text-muted">
                    {note ? `${(note.total / note.count).toFixed(1)}/5 (${note.count})` : "—"}
                  </td>
                </tr>
              );
            })}
            {listeEntreprises.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Aucune entreprise pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
