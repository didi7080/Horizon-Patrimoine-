import { Calculator, CreditCard } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReglagesForm } from "@/components/dashboard/reglages-form";
import { AbonnementBouton } from "@/components/dashboard/abonnement-bouton";
import { CarteParrainage } from "@/components/dashboard/carte-parrainage";
import { formatDateCourte } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { facturationConfiguree, planPourEffectif, planEffectif, nomPlan, accesOutilsCalcul } from "@/lib/stripe";
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
  const planSuggere = planPourEffectif(entreprise.nb_salaries);
  const planActuel = planEffectif(abonnement?.plan, entreprise.nb_salaries);

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
                Formule {nomPlan(planActuel)}
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
            <div className="flex flex-wrap items-center gap-2">
              {abonnement.statut === "actif" || abonnement.statut === "impaye" ? (
                <AbonnementBouton action="portail" size="sm">
                  Gérer mon abonnement
                </AbonnementBouton>
              ) : (
                <AbonnementBouton action="demarrer" plan={planSuggere} size="sm">
                  Passer à la formule {nomPlan(planSuggere)}
                </AbonnementBouton>
              )}
              {!accesOutilsCalcul(planActuel) && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/outils-premium">
                    <Calculator className="size-3.5" /> Passer à Premium (outils de calcul)
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
              La facturation en ligne n’est pas encore activée sur cette instance ArtisanRDV.
            </p>
          )}
        </Card>
      )}

      <CarteParrainage entrepriseId={entreprise.id} />

      <Card className="p-6">
        <ReglagesForm entreprise={entreprise} />
      </Card>
    </div>
  );
}
