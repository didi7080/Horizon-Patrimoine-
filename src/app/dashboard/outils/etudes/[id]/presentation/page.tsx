import { notFound } from "next/navigation";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluerFormule } from "@/lib/calculs/evaluateur";
import { formatPrix } from "@/lib/utils";
import { BoutonImprimer } from "@/components/dashboard/outils/bouton-imprimer";
import type { Champ, DonneesEtude, Formule, LigneMateriel } from "@/lib/calculs/types";

export const revalidate = 0;

export default async function PresentationEtudePage({ params }: PageProps<"/dashboard/outils/etudes/[id]/presentation">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: etude } = await admin
    .from("etudes")
    .select("*, module:modules_calcul(nom, champs, formules)")
    .eq("id", id)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!etude) notFound();

  const donnees = (etude.donnees as DonneesEtude) ?? {};
  const module_ = etude.module as { nom: string; champs: Champ[]; formules: Formule[] } | null;
  const champsValeurs = donnees.champs ?? {};
  const materiel: LigneMateriel[] = donnees.materiel ?? [];
  const totalMateriel = materiel.reduce((s, l) => s + l.quantite * l.prixUnitaireCents, 0);

  const portee: Record<string, number> = {};
  if (module_) {
    for (const champ of module_.champs) {
      if (champ.type === "nombre") {
        const valeur = champsValeurs[champ.id];
        portee[champ.id] = typeof valeur === "number" ? valeur : Number(valeur ?? 0);
      }
    }
  }
  const resultats =
    module_?.formules.map((f) => {
      try {
        const valeur = evaluerFormule(f.expression, portee);
        portee[f.id] = valeur;
        return { formule: f, valeur };
      } catch {
        return { formule: f, valeur: undefined };
      }
    }) ?? [];

  return (
    <div className="mx-auto max-w-3xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">Aperçu de la présentation client</p>
        <BoutonImprimer />
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-background p-8 print:border-none print:p-0">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-lg font-semibold text-foreground">{entreprise.nom}</p>
            {entreprise.adresse && <p className="text-sm text-muted">{entreprise.adresse}</p>}
            {entreprise.telephone && <p className="text-sm text-muted">{entreprise.telephone}</p>}
          </div>
          <p className="text-sm text-muted">{new Date(etude.created_at).toLocaleDateString("fr-FR")}</p>
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground">{etude.titre}</h1>
          {(etude.client_nom || etude.client_adresse) && (
            <p className="mt-1 text-sm text-muted">
              {[etude.client_nom, etude.client_adresse, etude.client_telephone, etude.client_email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {module_ && (
          <div>
            <h2 className="mb-2 font-medium text-foreground">{module_.nom}</h2>
            <table className="w-full text-sm">
              <tbody>
                {module_.champs.map((champ) => (
                  <tr key={champ.id} className="border-b border-border last:border-0">
                    <td className="py-1.5 text-muted">{champ.label}</td>
                    <td className="py-1.5 text-right font-medium text-foreground">
                      {String(champsValeurs[champ.id] ?? "—")} {champ.unite}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resultats.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {resultats.map(({ formule, valeur }) => (
                  <div key={formule.id} className="rounded-lg bg-surface p-3">
                    <p className="text-xs text-muted">{formule.label}</p>
                    <p className="text-lg font-semibold text-foreground">
                      {valeur !== undefined && Number.isFinite(valeur)
                        ? valeur.toLocaleString("fr-FR", { maximumFractionDigits: formule.decimales ?? 2 })
                        : "—"}{" "}
                      <span className="text-sm font-normal text-muted">{formule.unite}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {materiel.length > 0 && (
          <div>
            <h2 className="mb-2 font-medium text-foreground">Matériel & chiffrage</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1.5">Désignation</th>
                  <th className="py-1.5 text-right">Qté</th>
                  <th className="py-1.5 text-right">Prix unitaire</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {materiel.map((ligne) => (
                  <tr key={ligne.id} className="border-b border-border last:border-0">
                    <td className="py-1.5">
                      {ligne.designation} <span className="text-muted">({ligne.unite})</span>
                    </td>
                    <td className="py-1.5 text-right">{ligne.quantite}</td>
                    <td className="py-1.5 text-right">{formatPrix(ligne.prixUnitaireCents)}</td>
                    <td className="py-1.5 text-right font-medium">{formatPrix(ligne.quantite * ligne.prixUnitaireCents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-2 text-right font-semibold text-foreground">
                    Total
                  </td>
                  <td className="py-2 text-right font-semibold text-foreground">{formatPrix(totalMateriel)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {donnees.synthese && (
          <div>
            <h2 className="mb-2 font-medium text-foreground">Synthèse</h2>
            <p className="whitespace-pre-wrap text-sm text-muted">{donnees.synthese}</p>
          </div>
        )}

        <p className="border-t border-border pt-4 text-xs text-muted">
          Estimation réalisée par {entreprise.nom}. Les calculs ci-dessus sont des estimations ; un devis détaillé
          sera établi après validation.
        </p>
      </div>
    </div>
  );
}
