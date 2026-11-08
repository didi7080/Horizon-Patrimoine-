import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { BoutonSupprimer } from "@/components/dashboard/outils/bouton-supprimer";
import { supprimerLigneBibliotheque } from "@/app/dashboard/documents/actions";
import { formatPrix } from "@/lib/utils";

export const revalidate = 0;

export default async function BibliothequePage() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { data: lignes } = admin
    ? await admin.from("lignes_bibliotheque").select("*").eq("entreprise_id", entreprise.id).order("designation")
    : { data: null };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/documents" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux devis & factures
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bibliothèque de lignes</h1>
        <p className="mt-1 text-muted">
          Vos prestations courantes, à réutiliser dans un devis ou une facture sans tout retaper. Pour en ajouter une, enregistrez-la
          directement depuis une ligne d’un devis (icône{" "}
          <span className="inline-flex items-center rounded border border-border px-1 text-xs">signet</span>).
        </p>
      </div>

      <div className="space-y-2">
        {lignes && lignes.length > 0 ? (
          lignes.map((l) => (
            <Card key={l.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-foreground">{l.designation}</p>
                <p className="text-sm text-muted">
                  {formatPrix(l.prix_unitaire_cents)} · {l.unite} · TVA {l.taux_tva}%
                </p>
              </div>
              <BoutonSupprimer
                confirmation={`Retirer "${l.designation}" de la bibliothèque ?`}
                action={supprimerLigneBibliotheque.bind(null, l.id)}
              />
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-muted">
            Aucune ligne enregistrée pour le moment.
          </Card>
        )}
      </div>
    </div>
  );
}
