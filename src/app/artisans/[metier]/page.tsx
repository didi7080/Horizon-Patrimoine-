import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EntrepriseCard } from "@/components/marketing/entreprise-card";
import { createClient } from "@/lib/supabase/server";
import { metierParSlug } from "@/lib/metiers-seo";
import { slugify } from "@/lib/utils";

export const revalidate = 0;

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://artisanrdv.com";
}

export async function generateMetadata({ params }: PageProps<"/artisans/[metier]">): Promise<Metadata> {
  const { metier: slug } = await params;
  const metier = metierParSlug(slug);
  if (!metier) return { title: "Page introuvable — ArtisanRDV" };

  const titre = `${metier.valeur} : trouver un artisan et réserver en ligne — ArtisanRDV`;
  const description = `Comparez les ${metier.professionnelsPluriel} disponibles près de chez vous et réservez votre rendez-vous en ligne, sans appel téléphonique.`;
  return {
    title: titre,
    description,
    alternates: { canonical: `${baseUrl()}/artisans/${metier.slug}` },
    openGraph: { title: titre, description, type: "website" },
  };
}

export default async function MetierPage({ params }: PageProps<"/artisans/[metier]">) {
  const { metier: slug } = await params;
  const metier = metierParSlug(slug);
  if (!metier) notFound();

  const supabase = await createClient();
  const { data: entreprises } = await supabase
    .from("entreprises")
    .select("id, slug, nom, metier, ville, code_postal, couleur, logo_url")
    .eq("metier", metier.valeur)
    .order("nom")
    .limit(60);

  const villes = Array.from(
    new Map(
      (entreprises ?? [])
        .filter((e): e is typeof e & { ville: string } => Boolean(e.ville?.trim()))
        .map((e) => [slugify(e.ville), e.ville.trim()]),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${metier.professionnelsPluriel} sur ArtisanRDV`,
    itemListElement: (entreprises ?? []).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: e.nom,
        url: `${baseUrl()}/e/${e.slug}`,
        ...(e.ville ? { address: { "@type": "PostalAddress", addressLocality: e.ville } } : {}),
      },
    })),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-sm text-muted">
            <Link href="/recherche" className="hover:text-foreground">
              Trouver un artisan
            </Link>{" "}
            / {metier.valeur}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {metier.valeur} : trouvez un professionnel et réservez en ligne
          </h1>
          <p className="mt-4 max-w-2xl text-muted">{metier.intro}</p>

          <div className="mt-6 rounded-xl border border-border bg-background p-5">
            <h2 className="font-semibold text-foreground">Quand faire appel à {metier.articleSingulier} ?</h2>
            <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
              {metier.quandFaireAppel.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {villes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Par ville
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {villes.map(([villeSlug, villeNom]) => (
                  <Link
                    key={villeSlug}
                    href={`/artisans/${metier.slug}/${villeSlug}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border-strong px-3 py-1.5 text-sm text-foreground hover:bg-surface"
                  >
                    <MapPin className="size-3.5 text-muted-foreground" /> {villeNom}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <h2 className="font-semibold text-foreground">
              {entreprises && entreprises.length > 0
                ? `${entreprises.length} ${metier.professionnelsPluriel} sur ArtisanRDV`
                : `Bientôt des ${metier.professionnelsPluriel} sur ArtisanRDV`}
            </h2>
            {entreprises && entreprises.length > 0 ? (
              entreprises.map((entreprise) => <EntrepriseCard key={entreprise.id} entreprise={entreprise} />)
            ) : (
              <p className="text-sm text-muted">
                Aucun professionnel n&apos;est encore inscrit dans ce métier.{" "}
                <Link href="/pour-les-artisans" className="text-brand hover:underline">
                  Vous êtes {metier.professionnelsPluriel} ? Inscrivez votre entreprise.
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
