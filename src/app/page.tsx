import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Star,
  Users2,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SearchBar } from "@/components/marketing/search-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VALEURS = [
  {
    icon: CalendarCheck2,
    titre: "Réservation en ligne 24/7",
    description:
      "Vos clients réservent un créneau en 2 minutes, même à 22h — sans vous appeler pendant un chantier.",
  },
  {
    icon: BellRing,
    titre: "Rappels automatiques",
    description:
      "E-mail et SMS envoyés avant chaque rendez-vous : jusqu'à 80 % de rendez-vous manqués en moins.",
  },
  {
    icon: Users2,
    titre: "Toute l'équipe, un seul agenda",
    description:
      "Chaque salarié a ses horaires et ses prestations. Les créneaux se répartissent tout seuls.",
  },
  {
    icon: Star,
    titre: "Avis clients vérifiés",
    description:
      "Un avis n'est demandé qu'après un rendez-vous honoré : votre réputation reflète votre vrai travail.",
  },
  {
    icon: ShieldCheck,
    titre: "Zéro double réservation",
    description:
      "Délai minimum, temps de trajet, absences : le moteur de disponibilité respecte vos règles à la lettre.",
  },
  {
    icon: Clock3,
    titre: "Mise en place en 10 minutes",
    description:
      "Créez votre page, ajoutez vos prestations et votre équipe. Votre lien de réservation est prêt.",
  },
];

const ETAPES_CLIENT = [
  { titre: "Cherchez", description: "Trouvez un artisan par métier et par ville." },
  { titre: "Réservez", description: "Choisissez la prestation et le créneau qui vous arrange." },
  { titre: "Soyez rappelé", description: "Confirmation immédiate, rappel avant le jour J." },
];

const ETAPES_ARTISAN = [
  { titre: "Créez votre page", description: "Prestations, tarifs, équipe et horaires en quelques clics." },
  { titre: "Recevez des demandes", description: "Vos clients réservent directement, ou demandent, selon vos règles." },
  { titre: "Gérez votre agenda", description: "Une vue claire de la journée, sur ordinateur comme sur mobile." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-light/60 via-background to-background">
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="default" className="mb-5">
                <Wrench className="size-3.5" />
                Le Doctolib des artisans
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                La prise de rendez-vous en ligne,{" "}
                <span className="text-brand">enfin simple pour les artisans</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
                Plombiers, électriciens, chauffagistes… donnez à vos clients une vraie page de
                réservation en ligne, et à votre équipe un agenda qui ne se trompe jamais.
              </p>
            </div>

            <SearchBar className="mx-auto mt-9 max-w-2xl" />

            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-brand" /> Essai 14 jours, sans carte
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-brand" /> Sans engagement
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-brand" /> Assistance en français
              </span>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
                Pour vos clients
              </h2>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Un rendez-vous pris en moins de 2 minutes
              </p>
              <ol className="mt-8 space-y-6">
                {ETAPES_CLIENT.map((etape, i) => (
                  <li key={etape.titre} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{etape.titre}</p>
                      <p className="text-sm text-muted">{etape.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
                Pour votre entreprise
              </h2>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                Un agenda professionnel, sans effort
              </p>
              <ol className="mt-8 space-y-6">
                {ETAPES_ARTISAN.map((etape, i) => (
                  <li key={etape.titre} className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{etape.titre}</p>
                      <p className="text-sm text-muted">{etape.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Button asChild className="mt-8">
                <Link href="/inscription">
                  Créer ma page artisan <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="border-y border-border bg-surface py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Tout ce qu’il faut pour ne plus perdre un rendez-vous
              </h2>
              <p className="mt-3 text-muted">
                Conçu pour le rythme des artisans : chantiers, imprévus, équipes sur le terrain.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VALEURS.map((valeur) => (
                <Card key={valeur.titre} className="p-6">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                    <valeur.icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{valeur.titre}</h3>
                  <p className="mt-1.5 text-sm text-muted">{valeur.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Preuve sociale */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 rounded-2xl border border-border bg-background p-8 sm:p-12 md:grid-cols-3">
            <div>
              <p className="text-4xl font-semibold text-foreground">-80%</p>
              <p className="mt-1 text-sm text-muted">
                de rendez-vous non honorés grâce aux rappels automatiques
              </p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-foreground">10 min</p>
              <p className="mt-1 text-sm text-muted">pour créer sa page et commencer à recevoir des demandes</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-foreground">24/7</p>
              <p className="mt-1 text-sm text-muted">disponibilité de la réservation en ligne pour vos clients</p>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-border bg-foreground py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-background sm:text-3xl">
              Prêt à professionnaliser vos rendez-vous ?
            </h2>
            <p className="max-w-xl text-background/70">
              Rejoignez les artisans qui gèrent déjà leurs rendez-vous avec ArtisanRDV. Aucune carte
              bancaire requise pour démarrer.
            </p>
            <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
              <Link href="/inscription">
                Démarrer mon essai gratuit <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
