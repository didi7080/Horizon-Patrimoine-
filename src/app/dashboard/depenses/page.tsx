import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoutonSupprimer } from "@/components/dashboard/outils/bouton-supprimer";
import { DepenseFormDialog } from "@/components/dashboard/depenses/depense-form-dialog";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { bornesMois, moisCourant, libelleMois } from "@/lib/bilan/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";
import { supprimerDepense } from "@/app/dashboard/depenses/actions";

export const revalidate = 0;

export default async function DepensesPage({ searchParams }: PageProps<"/dashboard/depenses">) {
  const { mois: moisParam } = await searchParams;
  const mois = (Array.isArray(moisParam) ? moisParam[0] : moisParam) || moisCourant();
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { debut, fin } = bornesMois(mois);
  const { data: depenses } = admin
    ? await admin
        .from("depenses")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .gte("date", debut)
        .lt("date", fin)
        .order("date", { ascending: false })
    : { data: null };

  const liste = depenses ?? [];
  const total = liste.reduce((s, d) => s + d.montant_cents, 0);
  const parCategorie = new Map<string, number>();
  for (const d of liste) {
    parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant_cents);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dépenses</h1>
          <p className="mt-1 text-muted">Vos charges et frais professionnels, mois par mois.</p>
        </div>
        <DepenseFormDialog />
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

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium capitalize text-foreground">{libelleMois(mois)}</p>
          <p className="text-lg font-semibold text-foreground">Total : {formatPrix(total)}</p>
        </div>
        {parCategorie.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {[...parCategorie.entries()].map(([categorie, montant]) => (
              <Badge key={categorie} variant="neutral">
                {categorie} · {formatPrix(montant)}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {liste.length > 0 ? (
          liste.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-foreground">
                  {d.categorie} · {formatPrix(d.montant_cents)}
                </p>
                <p className="text-sm text-muted">
                  {formatDateCourte(d.date)}
                  {d.description ? ` · ${d.description}` : ""}
                </p>
              </div>
              <BoutonSupprimer confirmation="Supprimer cette dépense ?" action={supprimerDepense.bind(null, d.id)} />
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-muted">Aucune dépense enregistrée ce mois-ci.</Card>
        )}
      </div>
    </div>
  );
}
