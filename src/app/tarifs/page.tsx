import { Fragment } from "react";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card } from "@/components/ui/card";
import { CartesFormules } from "@/components/marketing/cartes-formules";

export const metadata: Metadata = { title: "Tarifs — ArtisanRDV" };

// Prix indicatifs : à ajuster selon votre positionnement avant mise en production.
// Tarifs annuels = 2 mois offerts (≈ -17 %) par rapport au mensuel × 12.
const FORMULES = [
  {
    nom: "Solo",
    description: "Jusqu'à 1 salarié",
    prixMois: 39,
    prixAn: 390,
    misEnAvant: false,
    inclus: [
      "Réservation en ligne, agenda et rappels automatiques",
      "Widget intégrable, avis clients, devis & factures",
      "Jusqu'à 1 salarié sur votre agenda",
    ],
  },
  {
    nom: "Équipe",
    description: "À partir de 2 salariés",
    prixMois: 89,
    prixAn: 890,
    misEnAvant: true,
    inclus: [
      "Tout ce qui est inclus dans Solo",
      "Agenda multi-salariés illimité",
      "Invitez vos collaborateurs avec leur propre accès",
    ],
  },
  {
    nom: "Premium",
    description: "Option ajoutée à Solo (69€/mois ou 690€/an) ou Équipe (119€/mois ou 1 190€/an)",
    prixMois: 30,
    prixAn: 300,
    option: true,
    misEnAvant: false,
    inclus: [
      "Les outils de calcul, en plus de votre formule Solo ou Équipe",
      "Modules de calcul personnalisables (vos propres formules)",
      "Assistant IA pour vos devis et questions du quotidien",
    ],
  },
] as const;

type Disponibilite = true | false | "premium";

const COMPARATIF: { categorie: string; lignes: { label: string; solo: Disponibilite; equipe: Disponibilite }[] }[] = [
  {
    categorie: "Réservation & agenda",
    lignes: [
      { label: "Page de réservation en ligne illimitée", solo: true, equipe: true },
      { label: "Widget intégrable sur votre site", solo: true, equipe: true },
      { label: "Rappels automatiques par e-mail", solo: true, equipe: true },
      { label: "Gestion des demandes, annulations et reports", solo: true, equipe: true },
      { label: "Agenda multi-salariés", solo: true, equipe: true },
    ],
  },
  {
    categorie: "Clients & facturation",
    lignes: [
      { label: "Devis, factures et relances automatiques", solo: true, equipe: true },
      { label: "Avis clients vérifiés", solo: true, equipe: true },
      { label: "Statistiques et export de vos données", solo: true, equipe: true },
    ],
  },
  {
    categorie: "Équipe",
    lignes: [
      { label: "Invitation de collaborateurs avec accès dédié au tableau de bord", solo: false, equipe: true },
    ],
  },
  {
    categorie: "Avec l'option Premium (+30€)",
    lignes: [
      { label: "Outils de calcul personnalisés par métier", solo: "premium", equipe: "premium" },
      { label: "Assistant IA (devis par message, questions admin/technique)", solo: "premium", equipe: "premium" },
    ],
  },
];

function PuceDisponibilite({ valeur }: { valeur: Disponibilite }) {
  if (valeur === true) return <Check className="mx-auto size-4 text-success" />;
  if (valeur === "premium") {
    return <span className="text-xs font-medium text-brand">+30€</span>;
  }
  return <Minus className="mx-auto size-4 text-muted-foreground" />;
}

const QUESTIONS = [
  {
    q: "L’essai gratuit nécessite-t-il une carte bancaire ?",
    r: "Non. Vous testez ArtisanRDV pendant 14 jours sans aucun moyen de paiement à renseigner.",
  },
  {
    q: "Puis-je changer d’avis après la période d’essai ?",
    r: "Oui, l’abonnement mensuel est sans engagement : vous pouvez résilier à tout moment depuis votre espace. L’abonnement annuel engage pour 1 an en échange des 2 mois offerts.",
  },
  {
    q: "Comment choisir entre Solo et Équipe ?",
    r: "La formule s’ajuste selon le nombre de salariés : Solo jusqu’à 1, Équipe à partir de 2. Le nombre de rendez-vous n’est jamais plafonné. La différence concrète : seule la formule Équipe permet d’inviter des collaborateurs avec leur propre accès au tableau de bord.",
  },
  {
    q: "Qu’est-ce que la formule Premium apporte en plus ?",
    r: "Premium ajoute les Outils de calcul à votre formule Solo ou Équipe pour 30€/mois de plus : vous créez vos propres modules de calcul adaptés à votre métier (vos champs, vos formules), les utilisez pour des études chantier chiffrées avec votre catalogue matériel, puis générez une présentation client imprimable.",
  },
  {
    q: "Quelle est la différence entre mensuel et annuel ?",
    r: "Le prix est le même, mais l’annuel vous fait économiser l’équivalent de 2 mois (payé en une fois, pour 1 an). C’est un engagement sur 1 an, contrairement au mensuel qui reste résiliable à tout moment.",
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

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <CartesFormules formules={FORMULES} />
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <h2 className="text-center text-xl font-semibold text-foreground">Comparez les formules en détail</h2>
          <Card className="mt-6 overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fonctionnalité</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold text-foreground">Solo</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold text-foreground">Équipe</th>
                </tr>
              </thead>
              <tbody>
                {COMPARATIF.map((groupe) => (
                  <Fragment key={groupe.categorie}>
                    <tr className="bg-surface">
                      <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {groupe.categorie}
                      </td>
                    </tr>
                    {groupe.lignes.map((ligne) => (
                      <tr key={ligne.label} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">{ligne.label}</td>
                        <td className="px-4 py-3 text-center">
                          <PuceDisponibilite valeur={ligne.solo} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PuceDisponibilite valeur={ligne.equipe} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
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
