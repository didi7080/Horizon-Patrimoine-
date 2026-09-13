import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReglagesForm } from "@/components/dashboard/reglages-form";
import { formatDateCourte } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

const LABEL_ABONNEMENT: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral" }> = {
  essai: { label: "Période d'essai", variant: "warning" },
  actif: { label: "Actif", variant: "success" },
  impaye: { label: "Impayé", variant: "danger" },
  annule: { label: "Annulé", variant: "neutral" },
};

export default async function ReglagesPage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: abonnement } = await supabase
    .from("abonnements")
    .select("*")
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Réglages</h1>
        <p className="mt-1 text-muted">Personnalisez votre page et vos règles de réservation.</p>
      </div>

      {abonnement && (
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Abonnement ArtisanRDV</p>
            <p className="text-sm text-muted">
              {abonnement.statut === "essai"
                ? `Essai jusqu'au ${formatDateCourte(abonnement.essai_fin)}`
                : abonnement.periode_fin
                  ? `Renouvellement le ${formatDateCourte(abonnement.periode_fin)}`
                  : null}
            </p>
          </div>
          <Badge variant={LABEL_ABONNEMENT[abonnement.statut]?.variant ?? "neutral"}>
            {LABEL_ABONNEMENT[abonnement.statut]?.label ?? abonnement.statut}
          </Badge>
        </Card>
      )}

      <Card className="p-6">
        <ReglagesForm entreprise={entreprise} />
      </Card>
    </div>
  );
}
