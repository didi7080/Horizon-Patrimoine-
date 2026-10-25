import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Tarifs — ArtisanRDV" };

// Prix indicatifs : à ajuster selon votre positionnement avant mise en production.
const FORMULES = [
  {
    nom: "Solo",
    description: "Jusqu'à 3 salariés",
    prix: 39,
    misEnAvant: false,
    inclus: [
      "Page de réservation en ligne illimitée",
      "Agenda jusqu'à 3 salariés",
      "Rappels automatiques par e-mail (SMS en option)",
      "Widget intégrable sur votre propre site internet",
      "Avis clients vérifiés",
      "Gestion des demandes, annulations et reports",
      "Assistance par e-mail",
    ],
  },
  {
    nom: "Équipe",
    description: "À partir de 4 salariés",
    prix: 89,
    misEnAvant: true,
    inclus: [
      "Tout ce qui est inclus dans Solo",
      "Agenda multi-salariés illimité",
      "Statistiques et export de vos données",
      "Invitation de membres avec accès dédié",
      "Assistance prioritaire",
    ],
  },
  {
    nom: "Premium",
    description: "Toute taille d'entreprise",
    prix: 119,
    misEnAvant: false,
    inclus: [
      "Tout ce qui est inclus dans Équipe",
      "Outils de calcul adaptés à votre métier",
      "Modules de calcul personnalisables (vos propres formules)",
      "Études chantier, catalogue matériel et chiffrage",
      "Présentations client imprimables",
    ],
  },
] as const;

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
    q: "Comment choisir entre Solo et Équipe ?",
    r: "La formule s’ajuste automatiquement selon le nombre de salariés que vous ajoutez : Solo jusqu’à 3, Équipe à partir de 4. Le nombre de rendez-vous n’est jamais plafonné.",
  },
  {
    q: "Qu’est-ce que la formule Premium apporte en plus ?",
    r: "Premium donne accès aux Outils de calcul : vous créez vos propres modules de calcul adaptés à votre métier (vos champs, vos formules), les utilisez pour des études chantier chiffrées avec votre catalogue matériel, puis générez une présentation client imprimable. Disponible quelle que soit la taille de votre entreprise.",
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
            Un tarif adapté à la taille de votre équipe
          </h1>
          <p className="mt-3 text-muted">
            Sans surprise, sans engagement. Solo et Équipe s’adaptent automatiquement à votre
            effectif ; Premium ajoute les outils de calcul pour tous. 14 jours d’essai offerts.
          </p>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-3">
          {FORMULES.map((formule) => (
            <Card
              key={formule.nom}
              className={
                "p-8 text-center" +
                (formule.misEnAvant ? " border-brand/30 shadow-lg shadow-slate-900/5" : "")
              }
            >
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">{formule.nom}</p>
              <p className="mt-3 flex items-end justify-center gap-1">
                <span className="text-5xl font-semibold text-foreground">{formule.prix}€</span>
                <span className="pb-1.5 text-muted">/ mois HT</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{formule.description}</p>
              <Button asChild size="lg" className="mt-6 w-full">
                <Link href="/inscription">
                  Démarrer l’essai gratuit <ArrowRight className="size-4" />
                </Link>
              </Button>
              <ul className="mt-8 space-y-3 text-left text-sm">
                {formule.inclus.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
