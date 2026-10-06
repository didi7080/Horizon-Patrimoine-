import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarCheck2, MapPin, Users2, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GROUPE, SOCIETES_GROUPE } from "@/lib/groupe";

export const metadata: Metadata = {
  title: `Le groupe ${GROUPE.nom} — ${GROUPE.accroche}`,
  description: `${GROUPE.nom} réunit des entreprises indépendantes de l'habitat : chauffage, plomberie, paysage et ramonage, sur ${GROUPE.territoire}.`,
};

const PRINCIPES = [
  {
    icon: Wrench,
    titre: "Tous les métiers de la maison",
    description:
      "Chauffage, plomberie, salle de bain, paysage, ramonage : le groupe couvre l'intérieur comme l'extérieur.",
  },
  {
    icon: Users2,
    titre: "Des entreprises indépendantes",
    description:
      "Chaque société garde son dirigeant, son savoir-faire et sa responsabilité. Le groupe les fait travailler ensemble.",
  },
  {
    icon: MapPin,
    titre: "Un ancrage local",
    description: `Des équipes de la région, qui interviennent sur ${GROUPE.territoire}.`,
  },
];

export default function GroupePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-foreground py-20 text-background">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
            <p className="text-sm font-medium uppercase tracking-widest text-background/60">
              Le groupe {GROUPE.sigle}
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{GROUPE.nom}</h1>
            <p className="mt-4 text-lg text-background/80 sm:text-xl">{GROUPE.accroche}.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                <Link href="#societes">
                  Découvrir nos sociétés <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-background/30 bg-transparent text-background hover:bg-background/10"
              >
                <Link href="/franchise">Rejoindre le réseau</Link>
              </Button>
            </div>
          </div>
          <dl className="mx-auto mt-14 grid max-w-4xl gap-6 px-4 sm:grid-cols-3 sm:px-6">
            {GROUPE.chiffres.map((c) => (
              <div key={c.libelle} className="rounded-xl border border-background/15 p-5 text-center">
                <dt className="text-2xl font-semibold">{c.valeur}</dt>
                <dd className="mt-1 text-sm text-background/70">{c.libelle}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-5 md:grid-cols-3">
            {PRINCIPES.map((p) => (
              <Card key={p.titre} className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-light text-brand-dark">
                  <p.icon className="size-5" />
                </div>
                <h2 className="mt-4 font-semibold text-foreground">{p.titre}</h2>
                <p className="mt-1.5 text-sm text-muted">{p.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="societes" className="scroll-mt-20 border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Les sociétés du groupe</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Un seul contact pour l&apos;ensemble de vos travaux : chaque société intervient dans son
              métier et passe le relais aux autres quand vous en avez besoin.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {SOCIETES_GROUPE.map((s) => (
                <Card key={s.nom} className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{s.nom}</h3>
                      <p className="text-sm font-medium text-brand-dark">{s.metier}</p>
                    </div>
                    {s.slug ? <Badge>Réservation en ligne</Badge> : null}
                  </div>
                  <p className="mt-3 text-sm text-muted">{s.description}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {s.prestations.map((p) => (
                      <li
                        key={p}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground"
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                  {s.slug ? (
                    <Button asChild className="mt-6 self-start">
                      <Link href={`/e/${s.slug}`}>
                        <CalendarCheck2 className="size-4" /> Prendre rendez-vous
                      </Link>
                    </Button>
                  ) : (
                    <p className="mt-6 text-xs text-muted-foreground">
                      Réservation en ligne bientôt disponible.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Artisan de l&apos;habitat ? Développez-vous avec le groupe
            </h2>
            <p className="max-w-2xl text-muted">
              Gardez votre indépendance et profitez d&apos;une marque, de clients partagés et
              d&apos;outils communs.
            </p>
            <Button asChild size="lg">
              <Link href="/franchise">
                Découvrir le réseau {GROUPE.nom} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
