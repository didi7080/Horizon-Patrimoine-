import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReglagesForm } from "@/components/dashboard/reglages-form";
import { formatDateCourte } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { facturationConfiguree, planPourEffectif } from "@/lib/stripe";
import { demarrerAbonnement, ouvrirPortailFacturation } from "@/app/dashboard/facturation/actions";

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

  const facturationPrete = facturationConfiguree();
  const plan = planPourEffectif(entreprise.nb_salaries);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Réglages</h1>
        <p className="mt-1 text-muted">Personnalisez votre page et vos règles de réservation.</p>
      </div>

      {abonnement && (
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="size-4 text-brand" /> Abonnement ArtisanRDV
              </p>
              <p className="mt-1 text-sm text-muted">
                Formule {plan === "equipe" ? "Équipe" : "Solo"}
                {abonnement.statut === "essai"
                  ? ` · Essai jusqu'au ${formatDateCourte(abonnement.essai_fin)}`
                  : abonnement.periode_fin
                    ? ` · Renouvellement le ${formatDateCourte(abonnement.periode_fin)}`
                    : ""}
              </p>
            </div>
            <Badge variant={LABEL_ABONNEMENT[abonnement.statut]?.variant ?? "neutral"}>
              {LABEL_ABONNEMENT[abonnement.statut]?.label ?? abonnement.statut}
            </Badge>
          </div>

          {facturationPrete ? (
            <form
              action={
                abonnement.statut === "actif" || abonnement.statut === "impaye"
                  ? ouvrirPortailFacturation
                  : demarrerAbonnement
              }
            >
              <Button type="submit" size="sm">
                {abonnement.statut === "actif" || abonnement.statut === "impaye"
                  ? "Gérer mon abonnement"
                  : "Passer à l'abonnement payant"}
              </Button>
            </form>
          ) : (
            <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
              La facturation en ligne n’est pas encore activée sur cette instance ArtisanRDV.
            </p>
          )}
        </Card>
      )}

      <Card className="p-6">
        <ReglagesForm entreprise={entreprise} />
      </Card>
    </div>
  );
}
