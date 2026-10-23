import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtudeFormDialog } from "@/components/dashboard/outils/etude-form-dialog";
import { formatDateLongue } from "@/lib/utils";

export const revalidate = 0;

export default async function EtudesPage() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const [{ data: etudes }, { data: modules }] = admin
    ? await Promise.all([
        admin
          .from("etudes")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .order("updated_at", { ascending: false }),
        admin.from("modules_calcul").select("id, nom").eq("entreprise_id", entreprise.id).order("nom"),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/outils" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Retour aux outils de calcul
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mes études</h1>
          <p className="mt-1 text-muted">Vos calculs par client, prêts à être présentés ou transformés en devis.</p>
        </div>
        <EtudeFormDialog modules={modules ?? []} />
      </div>

      <div className="space-y-3">
        {etudes && etudes.length > 0 ? (
          etudes.map((e) => (
            <Link key={e.id} href={`/dashboard/outils/etudes/${e.id}`}>
              <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-brand">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-brand" />
                  <div>
                    <p className="font-medium text-foreground">{e.titre}</p>
                    <p className="text-sm text-muted">
                      {e.client_nom ? `${e.client_nom} · ` : ""}
                      Mise à jour le {formatDateLongue(e.updated_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={e.statut === "termine" ? "success" : "neutral"}>
                  {e.statut === "termine" ? "Terminée" : "Brouillon"}
                </Badge>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Aucune étude pour le moment. Créez-en une pour commencer un calcul chez un client.
          </Card>
        )}
      </div>
    </div>
  );
}
