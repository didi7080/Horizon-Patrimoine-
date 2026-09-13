import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BellRing,
  Code2,
  Globe,
  ShieldCheck,
  Star,
  Users2,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Pour les artisans — ArtisanRDV" };

const ARGUMENTS = [
  {
    icon: Globe,
    titre: "Votre propre page, votre propre site",
    description:
      "Une page de réservation à votre image, et un widget à intégrer directement sur votre site internet : vos clients réservent sans jamais le quitter.",
  },
  {
    icon: BellRing,
    titre: "Moins de rendez-vous manqués",
    description:
      "Rappels automatiques par e-mail (et SMS en option) avant chaque rendez-vous : fini les créneaux perdus faute de rappel.",
  },
  {
    icon: Users2,
    titre: "Toute l'équipe au même endroit",
    description:
      "Chacun de vos salariés a ses horaires, ses prestations et son agenda. Les demandes se répartissent automatiquement.",
  },
  {
    icon: Star,
    titre: "Une réputation qui reflète votre travail",
    description:
      "Les avis ne sont demandés qu'après un rendez-vous réellement honoré, jamais achetés ni fabriqués.",
  },
  {
    icon: ShieldCheck,
    titre: "Des règles qui respectent votre métier",
    description:
      "Délai minimum avant réservation, temps de trajet entre deux interventions, zone géographique : vous définissez les règles, le moteur les applique.",
  },
  {
    icon: Code2,
    titre: "Aucune compétence technique requise",
    description:
      "Le code d'intégration se copie-colle en un clic. Votre créateur de site (WordPress, Wix, etc.) n'a rien de plus à faire.",
  },
];

export default function PourLesArtisansPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-brand-light/40 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              Le temps que vous passez au téléphone, reprenez-le
            </h1>
            <p className="mt-4 text-lg text-muted">
              ArtisanRDV s’occupe de la prise de rendez-vous pendant que vous êtes sur un chantier.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/inscription">
                Essayer gratuitement pendant 14 jours <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ARGUMENTS.map((arg) => (
              <Card key={arg.titre} className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <arg.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{arg.titre}</h3>
                <p className="mt-1.5 text-sm text-muted">{arg.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-foreground py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-background sm:text-3xl">
              Prêt à essayer ArtisanRDV ?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                <Link href="/inscription">Créer mon compte gratuitement</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10">
                <Link href="/tarifs">Voir les tarifs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
