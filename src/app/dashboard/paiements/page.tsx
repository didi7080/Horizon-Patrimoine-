import Link from "next/link";
import { CheckCircle2, CreditCard, Landmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { facturationConfiguree } from "@/lib/stripe";
import { demarrerConnexionStripe, etatConnexionStripe } from "@/app/dashboard/paiements/actions";

export const revalidate = 0;

export default async function PaiementsPage() {
  const { entreprise } = await getEntrepriseContext();
  const facturationPrete = facturationConfiguree();
  const statut = facturationPrete ? await etatConnexionStripe() : { connecte: false, actif: false };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Paiements clients</h1>
        <p className="mt-1 text-muted">
          Recevez directement les acomptes de vos clients sur votre propre compte bancaire.
        </p>
      </div>

      <Card className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
            <Landmark className="size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Compte de paiement Stripe</p>
            <p className="text-sm text-muted">{entreprise.nom}</p>
          </div>
          {statut.actif ? (
            <Badge variant="success" className="ml-auto">
              <CheckCircle2 className="size-3.5" /> Actif
            </Badge>
          ) : statut.connecte ? (
            <Badge variant="warning" className="ml-auto">
              Vérification en cours
            </Badge>
          ) : (
            <Badge variant="neutral" className="ml-auto">
              Non connecté
            </Badge>
          )}
        </div>

        <ul className="space-y-2 text-sm text-muted">
          <li>• Les acomptes payés par vos clients arrivent directement sur votre compte bancaire.</li>
          <li>• Aucune commission ArtisanRDV sur ces paiements.</li>
          <li>• Vous gérez vos remboursements et litiges depuis votre propre tableau de bord Stripe.</li>
        </ul>

        {!facturationPrete ? (
          <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
            Le paiement en ligne n’est pas encore activé sur cette instance ArtisanRDV.
          </p>
        ) : statut.actif ? (
          <Button asChild variant="outline">
            <Link href="https://dashboard.stripe.com" target="_blank">
              <CreditCard className="size-4" /> Gérer mon compte Stripe
            </Link>
          </Button>
        ) : (
          <form action={demarrerConnexionStripe}>
            <Button type="submit">
              <Landmark className="size-4" />
              {statut.connecte ? "Continuer la vérification" : "Connecter mon compte bancaire"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
