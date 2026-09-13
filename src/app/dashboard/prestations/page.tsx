import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrestationFormDialog } from "@/components/dashboard/prestation-form-dialog";
import { formatDuree, formatPrix } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { togglePrestationActif } from "@/app/dashboard/actions";

export const revalidate = 0;

export default async function PrestationsPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const [{ data: prestations }, { data: salaries }, { data: liaisons }] = await Promise.all([
    supabase
      .from("prestations")
      .select("*")
      .eq("entreprise_id", entreprise.id)
      .order("created_at"),
    supabase
      .from("salaries")
      .select("id, nom, fonction")
      .eq("entreprise_id", entreprise.id)
      .eq("actif", true)
      .order("nom"),
    supabase.from("prestation_salaries").select("prestation_id, salarie_id"),
  ]);

  const assignationsParPrestation = new Map<string, string[]>();
  for (const l of liaisons ?? []) {
    if (!assignationsParPrestation.has(l.prestation_id)) assignationsParPrestation.set(l.prestation_id, []);
    assignationsParPrestation.get(l.prestation_id)!.push(l.salarie_id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Prestations</h1>
          <p className="mt-1 text-muted">Les services que vos clients peuvent réserver en ligne.</p>
        </div>
        <PrestationFormDialog salaries={salaries ?? []} />
      </div>

      <div className="space-y-3">
        {prestations && prestations.length > 0 ? (
          prestations.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{p.nom}</p>
                  {!p.actif && <Badge variant="neutral">Masquée</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {formatDuree(p.duree_min)} · {formatPrix(p.prix_cents)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={togglePrestationActif.bind(null, p.id, !p.actif)}>
                  <Button size="sm" variant="ghost" type="submit">
                    {p.actif ? "Masquer" : "Réactiver"}
                  </Button>
                </form>
                <PrestationFormDialog
                  salaries={salaries ?? []}
                  prestation={p}
                  salarieIdsAssignes={assignationsParPrestation.get(p.id) ?? []}
                />
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Aucune prestation pour le moment. Ajoutez-en une pour commencer à recevoir des réservations.
          </Card>
        )}
      </div>
    </div>
  );
}
