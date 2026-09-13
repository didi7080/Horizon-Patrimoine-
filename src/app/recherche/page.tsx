import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FiltresRecherche } from "@/components/marketing/filtres-recherche";
import { EntrepriseCard } from "@/components/marketing/entreprise-card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

async function Resultats({
  metier,
  ville,
}: {
  metier?: string;
  ville?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("entreprises")
    .select("id, slug, nom, metier, ville, code_postal, couleur, logo_url")
    .order("nom");

  if (metier) query = query.eq("metier", metier);
  if (ville) query = query.or(`ville.ilike.%${ville}%,code_postal.ilike.${ville}%`);

  const { data: entreprises, error } = await query;

  if (error || !entreprises || entreprises.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <SearchX className="size-8 text-muted-foreground" />
        <p className="font-medium text-foreground">Aucun artisan ne correspond à cette recherche</p>
        <p className="text-sm text-muted">Essayez un autre métier ou une autre ville.</p>
      </div>
    );
  }

  const ids = entreprises.map((e) => e.id);
  const { data: prestations } = await supabase
    .from("prestations")
    .select("entreprise_id, prix_cents")
    .in("entreprise_id", ids)
    .eq("actif", true);

  const prixParEntreprise = new Map<string, number | null>();
  for (const p of prestations ?? []) {
    if (p.prix_cents === null) continue;
    const courant = prixParEntreprise.get(p.entreprise_id);
    if (courant === undefined || p.prix_cents < courant!) {
      prixParEntreprise.set(p.entreprise_id, p.prix_cents);
    }
  }

  const avisParEntreprise = await Promise.all(
    entreprises.map((e) => supabase.rpc("avis_entreprise", { p_slug: e.slug })),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {entreprises.length} artisan{entreprises.length > 1 ? "s" : ""} trouvé
        {entreprises.length > 1 ? "s" : ""}
      </p>
      {entreprises.map((entreprise, i) => {
        const avis = avisParEntreprise[i]?.data as
          | { moyenne: number | null; nombre: number }
          | null
          | undefined;
        return (
          <EntrepriseCard
            key={entreprise.id}
            entreprise={{
              ...entreprise,
              note: avis?.moyenne ?? null,
              nbAvis: avis?.nombre ?? 0,
              prixMin: prixParEntreprise.get(entreprise.id) ?? null,
            }}
          />
        );
      })}
    </div>
  );
}

export default async function RecherchePage({
  searchParams,
}: PageProps<"/recherche">) {
  const params = await searchParams;
  const metier = typeof params.metier === "string" ? params.metier : undefined;
  const ville = typeof params.ville === "string" ? params.ville : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold text-foreground">Trouver un artisan</h1>
          <p className="mt-1 text-muted">
            Comparez les artisans disponibles près de chez vous et réservez en ligne.
          </p>
          <div className="mt-6">
            <FiltresRecherche />
          </div>
          <div className="mt-8">
            <Suspense fallback={<p className="text-sm text-muted">Recherche en cours…</p>}>
              <Resultats metier={metier} ville={ville} />
            </Suspense>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
