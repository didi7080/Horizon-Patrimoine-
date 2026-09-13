import { Card } from "@/components/ui/card";
import { ClientRow } from "@/components/dashboard/client-row";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ClientsPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const [{ data: clients }, { data: rdvs }] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("entreprise_id", entreprise.id)
      .order("nom"),
    supabase.from("rendez_vous").select("client_id").eq("entreprise_id", entreprise.id),
  ]);

  const nbRdvParClient = new Map<string, number>();
  for (const r of rdvs ?? []) {
    if (!r.client_id) continue;
    nbRdvParClient.set(r.client_id, (nbRdvParClient.get(r.client_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
        <p className="mt-1 text-muted">{clients?.length ?? 0} clients enregistrés.</p>
      </div>

      <div className="space-y-2">
        {clients && clients.length > 0 ? (
          clients.map((c) => (
            <ClientRow key={c.id} client={c} nbRdv={nbRdvParClient.get(c.id) ?? 0} />
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Vos clients apparaîtront ici après leur première réservation.
          </Card>
        )}
      </div>
    </div>
  );
}
