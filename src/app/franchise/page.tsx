import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AVANTAGES_RESEAU,
  CONDITIONS_RESEAU,
  ENGAGEMENTS_RESEAU,
  ETAPES_ADHESION,
  FAQ_RESEAU,
  GROUPE,
} from "@/lib/groupe";

export const metadata: Metadata = {
  title: `Rejoindre le réseau ${GROUPE.nom}`,
  description: `Artisans de l'habitat : rejoignez le réseau ${GROUPE.nom}. Restez indépendant et profitez d'une marque, de clients partagés et d'outils communs.`,
};

const sujet = encodeURIComponent(`Candidature au réseau ${GROUPE.nom}`);
const corps = encodeURIComponent(
  [
    "Bonjour,",
    "",
    `Je souhaite rejoindre le réseau ${GROUPE.nom}.`,
    "",
    "Entreprise :",
    "Métier :",
    "Commune :",
    "Nombre de salariés :",
    "Qualifications / certifications :",
    "Téléphone :",
  ].join("\n"),
);
const lienCandidature = `mailto:${GROUPE.emailReseau}?subject=${sujet}&body=${corps}`;

export default function FranchisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-foreground py-20 text-background">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <p className="text-sm font-medium uppercase tracking-widest text-background/60">
              Réseau {GROUPE.nom}
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
              Rejoignez un groupe, gardez votre entreprise
            </h1>
            <p className="mt-4 text-lg text-background/80">
              Vous êtes artisan de l&apos;habitat ? Développez votre activité avec une marque
              commune, des clients partagés et des outils prêts à l&apos;emploi, sans renoncer à votre
              indépendance.
            </p>
            <Button asChild size="lg" className="mt-8 bg-brand hover:bg-brand-dark">
              <a href={lienCandidature}>
                Proposer ma candidature <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Comment ça fonctionne</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <p className="text-muted">
              {GROUPE.nom} réunit des entreprises indépendantes de l&apos;habitat, chacune experte dans son
              métier. Ensemble, elles proposent aux clients un interlocuteur unique pour toute la maison :
              quand un client a besoin d&apos;un autre métier, il est orienté vers une société du réseau.
            </p>
            <p className="text-muted">
              Chaque société reste maîtresse de son activité, de ses équipes et de ses chantiers. Le groupe
              apporte ce qu&apos;une entreprise seule a du mal à construire : une marque, des partenariats,
              des outils et la force d&apos;un collectif qui réinvestit pour se développer.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Ce que vous apporte le réseau</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {AVANTAGES_RESEAU.map((a) => (
                <Card key={a.titre} className="p-6">
                  <CheckCircle2 className="size-5 text-brand" />
                  <h3 className="mt-3 font-semibold text-foreground">{a.titre}</h3>
                  <p className="mt-1.5 text-sm text-muted">{a.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Les conditions pour nous rejoindre</h2>
            <ul className="mt-6 space-y-5">
              {CONDITIONS_RESEAU.map((c) => (
                <li key={c.titre}>
                  <h3 className="font-semibold text-foreground">{c.titre}</h3>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Vos engagements</h2>
            <ul className="mt-6 space-y-4">
              {ENGAGEMENTS_RESEAU.map((e) => (
                <li key={e} className="flex gap-3 text-sm text-muted">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-surface py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Les étapes de l&apos;adhésion</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {ETAPES_ADHESION.map((etape, i) => (
                <li key={etape.titre}>
                  <Card className="h-full p-6">
                    <span className="flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-semibold text-foreground">{etape.titre}</h3>
                    <p className="mt-1.5 text-sm text-muted">{etape.description}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-border rounded-xl border border-border">
            {FAQ_RESEAU.map((f) => (
              <details key={f.question} className="group p-5">
                <summary className="cursor-pointer list-none font-medium text-foreground">
                  {f.question}
                </summary>
                <p className="mt-2 text-sm text-muted">{f.reponse}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-foreground py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-background sm:text-3xl">
              Parlons de votre entreprise
            </h2>
            <p className="max-w-2xl text-background/75">
              Envoyez-nous quelques informations sur votre activité : nous revenons vers vous pour un
              premier échange, sans engagement.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand hover:bg-brand-dark">
                <a href={lienCandidature}>
                  <Mail className="size-4" /> Proposer ma candidature
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-background/30 bg-transparent text-background hover:bg-background/10"
              >
                <Link href="/groupe">Découvrir le groupe</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
