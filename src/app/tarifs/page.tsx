import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tarifs — ArtisanRDV" };

// Prix indicatif : à ajuster selon votre positionnement avant mise en production.
const PRIX_MENSUEL = 39;

const INCLUS = [
  "Page de réservation en ligne illimitée",
  "Agenda multi-salariés avec horaires personnalisés",
  "Rappels automatiques par e-mail (SMS en option)",
  "Widget intégrable sur votre propre site internet",
  "Avis clients vérifiés",
  "Gestion des demandes, annulations et reports",
  "Statistiques et export de vos données",
  "Assistance par e-mail",
];

const QUESTIONS = [
  {
    q: "L’essai gratuit nécessite-t-il une carte bancaire ?",
    r: "Non. Vous testez ArtisanRDV pendant 14 jours sans aucun moyen de paiement à renseigner.",
  },
  {
    q: "Puis-je changer d’avis après la période d’essai ?",
    r: "Oui, l’abonnement est sans engagement : vous pouvez résilier à tout moment depuis votre espace.",
  },
  {
    q: "Le nombre de salariés est-il limité ?",
    r: "Non, votre équipe et le nombre de rendez-vous ne sont pas plafonnés.",
  },
  {
    q: "Puis-je utiliser mon propre nom de domaine ?",
    r: "Vous pouvez intégrer la réservation directement sur votre site via le widget, en conservant votre propre domaine et votre référencement.",
  },
];

export default function TarifsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Un tarif simple, pour toute votre équipe
          </h1>
          <p className="mt-3 text-muted">
            Un seul abonnement, sans surprise, sans engagement. 14 jours d’essai offerts.
          </p>
        </section>

        <section className="mx-auto max-w-md px-4 pb-20 sm:px-6">
          <Card className="border-brand/30 p-8 text-center shadow-lg shadow-slate-900/5">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Standard</p>
            <p className="mt-3 flex items-end justify-center gap-1">
              <span className="text-5xl font-semibold text-foreground">{PRIX_MENSUEL}€</span>
              <span className="pb-1.5 text-muted">/ mois HT</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Par entreprise, équipe illimitée</p>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link href="/inscription">
                Démarrer l’essai gratuit <ArrowRight className="size-4" />
              </Link>
            </Button>
            <ul className="mt-8 space-y-3 text-left text-sm">
              {INCLUS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-foreground">Questions fréquentes</h2>
            <div className="mt-6 space-y-6">
              {QUESTIONS.map((item) => (
                <div key={item.q}>
                  <p className="font-medium text-foreground">{item.q}</p>
                  <p className="mt-1 text-sm text-muted">{item.r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
