import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

async function entreprisesDuMetierEtVille(metierValeur: string, villeSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entreprises")
    .select("id, slug, nom, metier, ville, code_postal, couleur, logo_url")
    .eq("metier", metierValeur)
    .order("nom")
    .limit(200);

  return (data ?? []).filter((e) => e.ville?.trim() && slugify(e.ville) === villeSlug);
}

export async function generateMetadata({ params }: PageProps<"/artisans/[metier]/[ville]">): Promise<Metadata> {
  const { metier: metierSlug, ville: villeSlug } = await params;
  const metier = metierParSlug(metierSlug);
  if (!metier) return { title: "Page introuvable — ArtisanRDV" };

  const entreprises = await entreprisesDuMetierEtVille(metier.valeur, villeSlug);
  if (entreprises.length === 0) return { title: "Page introuvable — ArtisanRDV" };

  const villeNom = entreprises[0].ville!;
  const titre = `${metier.valeur} à ${villeNom} : réserver en ligne — ArtisanRDV`;
  const description = `${entreprises.length} ${metier.professionnelsPluriel} à ${villeNom} disponibles sur ArtisanRDV. Comparez et réservez votre rendez-vous en ligne.`;
  return {
    title: titre,
    description,
    alternates: { canonical: `${baseUrl()}/artisans/${metier.slug}/${villeSlug}` },
    openGraph: { title: titre, description, type: "website" },
  };
}

export default async function MetierVillePage({ params }: PageProps<"/artisans/[metier]/[ville]">) {
  const { metier: metierSlug, ville: villeSlug } = await params;
  const metier = metierParSlug(metierSlug);
  if (!metier) notFound();

  const entreprises = await entreprisesDuMetierEtVille(metier.valeur, villeSlug);
  if (entreprises.length === 0) notFound();

  const villeNom = entreprises[0].ville!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${metier.professionnelsPluriel} à ${villeNom}`,
    itemListElement: entreprises.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: e.nom,
        url: `${baseUrl()}/e/${e.slug}`,
        address: { "@type": "PostalAddress", addressLocality: villeNom },
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
            /{" "}
            <Link href={`/artisans/${metier.slug}`} className="hover:text-foreground">
              {metier.valeur}
            </Link>{" "}
            / {villeNom}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {metier.valeur} à {villeNom}
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

          <div className="mt-8 space-y-4">
            <h2 className="font-semibold text-foreground">
              {entreprises.length} {metier.professionnelsPluriel} à {villeNom}
            </h2>
            {entreprises.map((entreprise) => (
              <EntrepriseCard key={entreprise.id} entreprise={entreprise} />
            ))}
          </div>

          <p className="mt-8 text-sm text-muted">
            <Link href={`/artisans/${metier.slug}`} className="text-brand hover:underline">
              Voir {metier.professionnelsPluriel} dans d&apos;autres villes
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
