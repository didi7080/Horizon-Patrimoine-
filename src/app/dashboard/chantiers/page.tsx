import { Card } from "@/components/ui/card";
import { ChantierFormDialog } from "@/components/dashboard/chantiers/chantier-form-dialog";
import { ChantierCarte } from "@/components/dashboard/chantiers/chantier-carte";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ChantiersPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const [{ data: chantiers }, { data: clients }] = await Promise.all([
    supabase
      .from("chantiers")
      .select("id, titre, statut, date_fin_prevue, clients(nom), etapes_chantier(fait)")
      .eq("entreprise_id", entreprise.id)
      .order("date_fin_prevue", { ascending: true, nullsFirst: false }),
    supabase.from("clients").select("id, nom").eq("entreprise_id", entreprise.id).order("nom"),
  ]);

  const chantiersTries = chantiers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Chantiers</h1>
          <p className="mt-1 text-muted">Regroupez RDV, devis et factures par chantier, et suivez leur avancement.</p>
        </div>
        <ChantierFormDialog clients={clients ?? []} />
      </div>

      <div className="space-y-3">
        {chantiersTries.length > 0 ? (
          chantiersTries.map((c) => <ChantierCarte key={c.id} chantier={c} />)
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Aucun chantier pour le moment. Créez-en un pour regrouper les RDV, devis et factures d’un client.
          </Card>
        )}
      </div>
    </div>
  );
}
