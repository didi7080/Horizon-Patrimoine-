import { notFound } from "next/navigation";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculerTotaux } from "@/lib/documents/types";
import type { LigneDocument } from "@/lib/documents/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";
import { BoutonImprimer } from "@/components/dashboard/outils/bouton-imprimer";

export const revalidate = 0;

export default async function PresentationDocumentPage({ params }: PageProps<"/dashboard/documents/[id]/presentation">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: document } = await admin
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!document) notFound();

  const lignes = (document.lignes as LigneDocument[] | null) ?? [];
  const totaux = calculerTotaux(lignes);
  const estDevis = document.type === "devis";
  const adresseComplete = [entreprise.adresse, [entreprise.code_postal, entreprise.ville].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">Aperçu {estDevis ? "du devis" : "de la facture"}</p>
        <BoutonImprimer />
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-background p-8 text-sm print:border-none print:p-0">
        <div className="flex items-start justify-between gap-6 border-b border-border pb-4">
          <div>
            <p className="text-lg font-semibold text-foreground">{entreprise.nom}</p>
            {entreprise.forme_juridique && <p className="text-muted">{entreprise.forme_juridique}</p>}
            {adresseComplete && <p className="text-muted">{adresseComplete}</p>}
            {entreprise.telephone && <p className="text-muted">Tél. {entreprise.telephone}</p>}
            {entreprise.email && <p className="text-muted">{entreprise.email}</p>}
            {entreprise.siret && <p className="text-muted">SIRET {entreprise.siret}</p>}
            {entreprise.assujetti_tva ? (
              entreprise.numero_tva && <p className="text-muted">TVA intracommunautaire {entreprise.numero_tva}</p>
            ) : (
              <p className="text-muted">TVA non applicable, art. 293 B du CGI</p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-xl font-semibold text-foreground">
              {estDevis ? "DEVIS" : "FACTURE"} N° {document.numero}
            </h1>
            <p className="mt-1 text-muted">Émis le {formatDateCourte(document.date_emission)}</p>
            {document.date_prestation && (
              <p className="text-muted">Début des travaux : {formatDateCourte(document.date_prestation)}</p>
            )}
            {estDevis && document.date_validite && (
              <p className="text-muted">Valable jusqu’au {formatDateCourte(document.date_validite)}</p>
            )}
            {!estDevis && document.date_echeance && (
              <p className="text-muted">À régler avant le {formatDateCourte(document.date_echeance)}</p>
            )}
          </div>
        </div>

        <div>
          <p className="font-medium text-foreground">Client</p>
          <p className="text-muted">{document.client_nom}</p>
          {document.client_adresse && <p className="text-muted">{document.client_adresse}</p>}
          {[document.client_telephone, document.client_email].filter(Boolean).length > 0 && (
            <p className="text-muted">{[document.client_telephone, document.client_email].filter(Boolean).join(" · ")}</p>
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

        {document.notes && (
          <div>
            <p className="font-medium text-foreground">Conditions particulières</p>
            <p className="whitespace-pre-line text-muted">{document.notes}</p>
          </div>
        )}

        <div className="space-y-1 border-t border-border pt-4 text-xs text-muted">
          {entreprise.assurance_nom && (
            <p>
              Assurance responsabilité civile professionnelle et garantie décennale souscrite auprès de{" "}
              {entreprise.assurance_nom}
              {entreprise.assurance_zone ? `, couvrant ${entreprise.assurance_zone}` : ""}.
            </p>
          )}
          {!estDevis && (
            <p>
              Conditions de règlement : paiement à réception de facture, sauf accord contraire. En cas de retard de
              paiement, une pénalité égale à trois fois le taux d’intérêt légal est applicable (loi n° 2008-776 du 4
              août 2008), ainsi qu’une indemnité forfaitaire de 40 € pour frais de recouvrement. Pas d’escompte pour
              paiement anticipé.
            </p>
          )}
          {estDevis && <p>Devis gratuit, sans engagement. Un acompte pourra être demandé à la signature.</p>}
          {entreprise.mentions_legales && <p className="whitespace-pre-line">{entreprise.mentions_legales}</p>}
        </div>

        {estDevis && (
          <div className="mt-6 flex justify-end print:break-inside-avoid">
            <div className="w-64 rounded-lg border border-border p-4 text-center">
              <p className="font-medium text-foreground">Bon pour accord</p>
              <p className="mt-1 text-xs text-muted">Date et signature du client</p>
              <div className="mt-8 h-16 border-b border-dashed border-border" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
