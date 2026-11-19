import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Receipt, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/statut-badge";
import { ChantierFormDialog } from "@/components/dashboard/chantiers/chantier-form-dialog";
import { EtapesChantier } from "@/components/dashboard/chantiers/etapes-chantier";
import { LierExistant } from "@/components/dashboard/chantiers/lier-existant";
import { StatutChantierBoutons } from "@/components/dashboard/chantiers/statut-chantier-boutons";
import { lierChantierRdv, lierChantierDocument } from "@/app/dashboard/chantiers/actions";
import { formatDateCourte, formatHeure, formatPrix } from "@/lib/utils";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 0;

const LABEL_STATUT_DOCUMENT: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  brouillon: { label: "Brouillon", variant: "neutral" },
  envoye: { label: "Envoyé", variant: "info" },
  envoyee: { label: "Envoyée", variant: "info" },
  accepte: { label: "Accepté", variant: "success" },
  refuse: { label: "Refusé", variant: "danger" },
  payee: { label: "Payée", variant: "success" },
};

export default async function ChantierPage({ params }: PageProps<"/dashboard/chantiers/[id]">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: chantier } = await supabase
    .from("chantiers")
    .select("*, clients(id, nom, telephone)")
    .eq("id", id)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!chantier) notFound();

  const admin = createAdminClient();

  const [{ data: etapes }, { data: rdvLies }, { data: rdvDelies }, { data: clients }, { data: materielConsomme }] = await Promise.all([
    supabase.from("etapes_chantier").select("*").eq("chantier_id", id).order("ordre"),
    supabase
      .from("rendez_vous")
      .select("id, debut, statut, prestations(nom)")
      .eq("chantier_id", id)
      .order("debut", { ascending: false }),
    supabase
      .from("rendez_vous")
      .select("id, debut, prestations(nom)")
      .eq("entreprise_id", entreprise.id)
      .eq("client_id", chantier.client_id)
      .is("chantier_id", null)
      .order("debut", { ascending: false })
      .limit(20),
    supabase.from("clients").select("id, nom").eq("entreprise_id", entreprise.id).order("nom"),
    supabase
      .from("mouvements_stock")
      .select("id, quantite, salaries(nom), materiel_catalogue(designation, unite, prix_achat_cents, coefficient)")
      .eq("chantier_id", id)
      .eq("type", "prise")
      .order("created_at", { ascending: false }),
  ]);

  // La table `documents` n'a aucune policy RLS pour les utilisateurs authentifiés :
  // son accès passe toujours par le client admin, comme partout ailleurs dans l'app.
  const [{ data: documentsLies }, { data: documentsDelies }] = admin
    ? await Promise.all([
        admin
          .from("documents")
          .select("id, numero, type, statut, lignes, date_emission")
          .eq("chantier_id", id)
          .order("date_emission", { ascending: false }),
        admin
          .from("documents")
          .select("id, numero, type, date_emission")
          .eq("entreprise_id", entreprise.id)
          .eq("client_id", chantier.client_id)
          .is("chantier_id", null)
          .order("date_emission", { ascending: false })
          .limit(20),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/chantiers" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux chantiers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{chantier.titre}</h1>
          <p className="mt-1 text-muted">
            {chantier.clients?.nom}
            {chantier.clients?.telephone ? ` · ${chantier.clients.telephone}` : ""}
          </p>
        </div>
        <ChantierFormDialog clients={clients ?? []} chantier={chantier} />
      </div>

      <Card className="space-y-3 p-5">
        <StatutChantierBoutons chantierId={chantier.id} statutActuel={chantier.statut} />
        <div className="grid grid-cols-2 gap-3 text-sm">
          {chantier.adresse && (
            <div>
              <p className="text-muted-foreground">Adresse</p>
              <p className="text-foreground">{chantier.adresse}</p>
            </div>
          )}
          {chantier.date_debut_prevue && (
            <div>
              <p className="text-muted-foreground">Début prévu</p>
              <p className="text-foreground">{formatDateCourte(chantier.date_debut_prevue)}</p>
            </div>
          )}
          {chantier.date_fin_prevue && (
            <div>
              <p className="text-muted-foreground">Fin prévue</p>
              <p className="text-foreground">{formatDateCourte(chantier.date_fin_prevue)}</p>
            </div>
          )}
        </div>
        {chantier.notes && <p className="rounded-md bg-surface p-3 text-sm text-foreground">{chantier.notes}</p>}
      </Card>

      <Card className="p-5">
        <EtapesChantier chantierId={chantier.id} etapes={etapes ?? []} />
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium text-foreground">Rendez-vous liés</p>
        {(rdvLies ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucun rendez-vous lié à ce chantier.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {(rdvLies ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span className="text-foreground">
                  {formatDateCourte(r.debut)} à {formatHeure(r.debut)} — {r.prestations?.nom ?? "Rendez-vous"}
                </span>
                <StatutBadge statut={r.statut} />
              </li>
            ))}
          </ul>
        )}
        <LierExistant
          items={(rdvDelies ?? []).map((r) => ({
            id: r.id,
            label: `${formatDateCourte(r.debut)} à ${formatHeure(r.debut)} — ${r.prestations?.nom ?? "Rendez-vous"}`,
          }))}
          placeholder="Lier un rendez-vous existant…"
          onLier={lierChantierRdv.bind(null, chantier.id)}
        />
      </Card>

      <Card className="space-y-3 p-5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Package className="size-4" /> Matériel consommé
        </p>
        {(materielConsomme ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucune pièce prise en stock pour ce chantier pour le moment.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {(materielConsomme ?? []).map((m) => {
              const article = m.materiel_catalogue;
              const prixVente =
                article?.prix_achat_cents !== null && article?.prix_achat_cents !== undefined
                  ? Math.round(article.prix_achat_cents * article.coefficient * m.quantite)
                  : null;
              return (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">
                    {m.quantite} {article?.unite ?? ""} — {article?.designation ?? "Article"}
                    {m.salaries?.nom && <span className="text-muted"> · {m.salaries.nom}</span>}
                  </span>
                  {prixVente !== null && <span className="text-muted">{formatPrix(prixVente)}</span>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted">
          Pour facturer ces pièces, ouvrez un devis/facture lié et utilisez le sélecteur « Depuis le catalogue matériel ».
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <p className="text-sm font-medium text-foreground">Devis & factures liés</p>
        {(documentsLies ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucun document lié à ce chantier.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {(documentsLies ?? []).map((d) => {
              const totaux = calculerTotaux((d.lignes as LigneDocument[] | null) ?? []);
              const statut = LABEL_STATUT_DOCUMENT[d.statut] ?? { label: d.statut, variant: "neutral" as const };
              return (
                <li key={d.id}>
                  <Link href={`/dashboard/documents/${d.id}`} className="flex items-center justify-between gap-2 hover:text-brand">
                    <span className="flex items-center gap-1.5 text-foreground">
                      {d.type === "devis" ? <FileText className="size-3.5" /> : <Receipt className="size-3.5" />}
                      {d.numero} · {formatPrix(totaux.totalTTC)} TTC
                    </span>
                    <Badge variant={statut.variant}>{statut.label}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <LierExistant
          items={(documentsDelies ?? []).map((d) => ({
            id: d.id,
            label: `${d.numero} (${d.type === "devis" ? "Devis" : "Facture"})`,
          }))}
          placeholder="Lier un devis/facture existant…"
          onLier={lierChantierDocument.bind(null, chantier.id)}
        />
      </Card>
    </div>
  );
}
