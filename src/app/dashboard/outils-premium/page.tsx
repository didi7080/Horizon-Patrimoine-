import { Calculator, Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { facturationConfiguree, getPrixAbonnementCents } from "@/lib/stripe";
import { formatPrix } from "@/lib/utils";
import { demarrerAbonnement } from "@/app/dashboard/facturation/actions";

export const revalidate = 0;

const AVANTAGES = [
  "Un module de calcul par métier, adapté à votre activité",
  "Vos propres champs et formules — vous gardez la main sur vos calculs",
  "Des études chantier par client, avec résultats calculés en direct",
  "Un catalogue matériel réutilisable pour chiffrer vos devis",
  "Une présentation client imprimable en un clic",
];

export default async function OutilsPremiumPage() {
  const { entreprise } = await getEntrepriseContext();
  const facturationPrete = facturationConfiguree();
  const prixCents = await getPrixAbonnementCents("premium");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-light text-brand">
          <Calculator className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Outils de calcul</h1>
        <p className="mt-1 text-muted">
          Réservés à la formule Premium
          {entreprise.metier ? ` — disponibles pour votre métier (${entreprise.metier})` : ""}.
        </p>
      </div>

      <Card className="space-y-5 p-6">
        <ul className="space-y-2.5 text-sm">
          {AVANTAGES.map((avantage) => (
            <li key={avantage} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-brand" />
              <span className="text-foreground">{avantage}</span>
            </li>
          ))}
        </ul>

        {facturationPrete && prixCents !== null ? (
          <div className="rounded-lg bg-surface p-4 text-center">
            <p className="text-3xl font-semibold text-foreground">
              {formatPrix(prixCents)} <span className="text-base font-normal text-muted">/ mois HT</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Quelle que soit la taille de votre entreprise.</p>
          </div>
        ) : null}

        {facturationPrete && prixCents !== null ? (
          <form action={demarrerAbonnement.bind(null, "premium")}>
            <Button type="submit" size="lg" className="w-full">
              <Sparkles className="size-4" /> Passer à Premium
            </Button>
          </form>
        ) : (
          <p className="rounded-lg bg-surface px-3 py-2 text-center text-xs text-muted-foreground">
            La formule Premium n’est pas encore activée sur cette instance ArtisanRDV.
          </p>
        )}
      </Card>
    </div>
  );
}
