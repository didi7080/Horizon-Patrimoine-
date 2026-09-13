import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { EntrepriseProfil } from "@/components/booking/entreprise-profil";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("nom, metier, ville, description")
    .eq("slug", slug)
    .maybeSingle();

  if (!entreprise) return { title: "Artisan introuvable — ArtisanRDV" };

  const titre = `${entreprise.nom}${entreprise.metier ? ` — ${entreprise.metier}` : ""}${entreprise.ville ? ` à ${entreprise.ville}` : ""}`;
  const description =
    entreprise.description ??
    `Prenez rendez-vous en ligne avec ${entreprise.nom}${entreprise.ville ? ` à ${entreprise.ville}` : ""}. Réservation immédiate, rappel automatique avant votre rendez-vous.`;

  return {
    title: `${titre} — Prendre rendez-vous`,
    description,
    openGraph: { title: titre, description, type: "website" },
  };
}

export default async function EntreprisePage({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <EntrepriseProfil slug={slug} />
      </main>
      <SiteFooter />
    </div>
  );
}
