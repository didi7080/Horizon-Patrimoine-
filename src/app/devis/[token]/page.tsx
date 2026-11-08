import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { createClient } from "@/lib/supabase/server";
import { calculerTotaux, type LigneDocument } from "@/lib/documents/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";
import { RepondreDevis } from "@/components/booking/repondre-devis";

export const revalidate = 0;

export type DevisPublic = {
  id: string;
  numero: string;
  statut: string;
  lignes: LigneDocument[] | null;
  client_nom: string;
  client_adresse: string | null;
  client_telephone: string | null;
  client_email: string | null;
  date_emission: string;
  date_prestation: string | null;
  date_validite: string | null;
  notes: string | null;
  entreprise_nom: string;
  entreprise_forme_juridique: string | null;
  entreprise_adresse: string | null;
  entreprise_code_postal: string | null;
  entreprise_ville: string | null;
  entreprise_telephone: string | null;
  entreprise_email: string | null;
  entreprise_siret: string | null;
  entreprise_assujetti_tva: boolean;
  entreprise_numero_tva: string | null;
  entreprise_assurance_nom: string | null;
  entreprise_assurance_zone: string | null;
  entreprise_mentions_legales: string | null;
};

export default async function DevisTokenPage({ params }: PageProps<"/devis/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("devis_par_token", { p_token: token });
  const devis = data as DevisPublic | null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {devis ? <ContenuDevis devis={devis} token={token} /> : <DevisIntrouvable />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function DevisIntrouvable() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
      <p className="font-medium text-foreground">Devis introuvable</p>
      <p className="mt-1 text-sm text-muted">Ce lien n’est plus valide. Vérifiez l’e-mail reçu de l’artisan.</p>
    </div>
  );
}

function ContenuDevis({ devis, token }: { devis: DevisPublic; token: string }) {
  const lignes = devis.lignes ?? [];
  const totaux = calculerTotaux(lignes);
  const adresseComplete = [devis.entreprise_adresse, [devis.entreprise_code_postal, devis.entreprise_ville].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="space-y-6 rounded-xl border border-border bg-background p-8 text-sm">
      <div className="flex items-start justify-between gap-6 border-b border-border pb-4">
        <div>
          <p className="text-lg font-semibold text-foreground">{devis.entreprise_nom}</p>
          {devis.entreprise_forme_juridique && <p className="text-muted">{devis.entreprise_forme_juridique}</p>}
          {adresseComplete && <p className="text-muted">{adresseComplete}</p>}
          {devis.entreprise_telephone && <p className="text-muted">Tél. {devis.entreprise_telephone}</p>}
          {devis.entreprise_email && <p className="text-muted">{devis.entreprise_email}</p>}
          {devis.entreprise_siret && <p className="text-muted">SIRET {devis.entreprise_siret}</p>}
          {devis.entreprise_assujetti_tva ? (
            devis.entreprise_numero_tva && <p className="text-muted">TVA intracommunautaire {devis.entreprise_numero_tva}</p>
          ) : (
            <p className="text-muted">TVA non applicable, art. 293 B du CGI</p>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold text-foreground">DEVIS N° {devis.numero}</h1>
          <p className="mt-1 text-muted">Émis le {formatDateCourte(devis.date_emission)}</p>
          {devis.date_prestation && <p className="text-muted">Début des travaux : {formatDateCourte(devis.date_prestation)}</p>}
          {devis.date_validite && <p className="text-muted">Valable jusqu’au {formatDateCourte(devis.date_validite)}</p>}
        </div>
      </div>

      <div>
        <p className="font-medium text-foreground">Client</p>
        <p className="text-muted">{devis.client_nom}</p>
        {devis.client_adresse && <p className="text-muted">{devis.client_adresse}</p>}
        {[devis.client_telephone, devis.client_email].filter(Boolean).length > 0 && (
          <p className="text-muted">{[devis.client_telephone, devis.client_email].filter(Boolean).join(" · ")}</p>
        )}
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-1.5">Désignation</th>
            <th className="py-1.5 text-right">Qté</th>
            <th className="py-1.5 text-right">Unité</th>
            <th className="py-1.5 text-right">Prix unit. HT</th>
            <th className="py-1.5 text-right">TVA</th>
            <th className="py-1.5 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.id} className="border-b border-border last:border-0">
              <td className="py-1.5 text-foreground">{ligne.designation}</td>
              <td className="py-1.5 text-right text-foreground">{ligne.quantite}</td>
              <td className="py-1.5 text-right text-foreground">{ligne.unite}</td>
              <td className="py-1.5 text-right text-foreground">{formatPrix(ligne.prixUnitaireCents)}</td>
              <td className="py-1.5 text-right text-foreground">{ligne.tauxTva}%</td>
              <td className="py-1.5 text-right text-foreground">{formatPrix(ligne.quantite * ligne.prixUnitaireCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col items-end gap-1">
        <p className="text-muted">Total HT : {formatPrix(totaux.totalHT)}</p>
        {totaux.parTaux.map((t) => (
          <p key={t.taux} className="text-muted">
            Dont TVA {t.taux}% : {formatPrix(t.montantTva)}
          </p>
        ))}
        <p className="text-base font-semibold text-foreground">Total TTC : {formatPrix(totaux.totalTTC)}</p>
      </div>

      {devis.notes && (
        <div>
          <p className="font-medium text-foreground">Conditions particulières</p>
          <p className="whitespace-pre-line text-muted">{devis.notes}</p>
        </div>
      )}

      <div className="space-y-1 border-t border-border pt-4 text-xs text-muted">
        {devis.entreprise_assurance_nom && (
          <p>
            Assurance responsabilité civile professionnelle et garantie décennale souscrite auprès de{" "}
            {devis.entreprise_assurance_nom}
            {devis.entreprise_assurance_zone ? `, couvrant ${devis.entreprise_assurance_zone}` : ""}.
          </p>
        )}
        <p>Devis gratuit, sans engagement. Un acompte pourra être demandé à la signature.</p>
        {devis.entreprise_mentions_legales && <p className="whitespace-pre-line">{devis.entreprise_mentions_legales}</p>}
      </div>

      <RepondreDevis token={token} statutInitial={devis.statut} />
    </div>
  );
}
