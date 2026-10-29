import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoutonImprimer } from "@/components/dashboard/outils/bouton-imprimer";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculerBilanMensuel, bornesMois, moisCourant, libelleMois } from "@/lib/bilan/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";

export const revalidate = 0;

const LABELS_STATUT: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
};

export default async function BilanPage({ searchParams }: PageProps<"/dashboard/bilan">) {
  const { mois: moisParam } = await searchParams;
  const mois = (Array.isArray(moisParam) ? moisParam[0] : moisParam) || moisCourant();
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { debut, fin } = bornesMois(mois);
  const { data: documents } = admin
    ? await admin
        .from("documents")
        .select("id, type, numero, client_nom, date_emission, statut, lignes")
        .eq("entreprise_id", entreprise.id)
        .gte("date_emission", debut)
        .lt("date_emission", fin)
        .order("date_emission")
    : { data: null };

  const bilan = calculerBilanMensuel(mois, documents ?? []);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bilan mensuel</h1>
          <p className="mt-1 text-muted">Chiffre d’affaires de facturation, à partir de vos devis et factures.</p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="mois"
            defaultValue={mois}
            className="h-10 rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
          />
          <Button type="submit" variant="outline" size="sm">
            Afficher
          </Button>
        </form>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-background p-8 text-sm print:border-none print:p-0">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-lg font-semibold capitalize text-foreground">Bilan — {libelleMois(mois)}</p>
            <p className="text-muted">{entreprise.nom}</p>
          </div>
          <BoutonImprimer />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Facturé TTC</p>
            <p className="text-lg font-semibold text-foreground">{formatPrix(bilan.totalFactureTTC)}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Encaissé</p>
            <p className="text-lg font-semibold text-foreground">{formatPrix(bilan.totalEncaisseTTC)}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">En attente</p>
            <p className="text-lg font-semibold text-foreground">{formatPrix(bilan.totalEnAttenteTTC)}</p>
          </div>
          <div className="rounded-lg bg-surface p-3">
            <p className="text-xs text-muted">Devis émis ({bilan.nbDevisEmis})</p>
            <p className="text-lg font-semibold text-foreground">{formatPrix(bilan.totalDevisTTC)}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 font-medium text-foreground">Factures du mois</h2>
          {bilan.factures.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1.5">N°</th>
                  <th className="py-1.5">Client</th>
                  <th className="py-1.5">Date</th>
                  <th className="py-1.5 text-right">Total TTC</th>
                  <th className="py-1.5 text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {bilan.factures.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0">
                    <td className="py-1.5 text-foreground">{f.numero}</td>
                    <td className="py-1.5 text-foreground">{f.clientNom}</td>
                    <td className="py-1.5 text-foreground">{formatDateCourte(f.dateEmission)}</td>
                    <td className="py-1.5 text-right text-foreground">{formatPrix(f.totalTTC)}</td>
                    <td className="py-1.5 text-right">
                      <Badge variant={f.statut === "payee" ? "success" : "neutral"}>
                        {LABELS_STATUT[f.statut] ?? f.statut}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">Aucune facture émise ce mois-ci.</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 border-t border-border pt-3">
          <p className="text-muted">Total HT : {formatPrix(bilan.totalFactureHT)}</p>
          <p className="text-muted">Total TVA : {formatPrix(bilan.totalFactureTVA)}</p>
          <p className="text-base font-semibold text-foreground">Total TTC : {formatPrix(bilan.totalFactureTTC)}</p>
        </div>

        <p className="border-t border-border pt-3 text-xs text-muted print:hidden">
          Ce bilan reprend uniquement le chiffre d’affaires de facturation (devis & factures). Les charges et dépenses
          ne sont pas encore suivies dans ArtisanRDV.
        </p>
      </div>

      <div className="flex justify-end print:hidden">
        <Button asChild variant="outline" size="sm">
          <Link href="/api/export/clients">
            <Download className="size-3.5" /> Exporter mes clients (CSV)
          </Link>
        </Button>
      </div>
    </div>
  );
}
