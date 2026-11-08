import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientsListe } from "@/components/dashboard/clients/clients-liste";
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

  const nbRdvParClient: Record<string, number> = {};
  for (const r of rdvs ?? []) {
    if (!r.client_id) continue;
    nbRdvParClient[r.client_id] = (nbRdvParClient[r.client_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <p className="mt-1 text-muted">{clients?.length ?? 0} clients enregistrés.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/api/export/clients">
            <Download className="size-3.5" /> Exporter (CSV)
          </a>
        </Button>
      </div>

      <ClientsListe clients={clients ?? []} nbRdvParClient={nbRdvParClient} />
    </div>
  );
}
