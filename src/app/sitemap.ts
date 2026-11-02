import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { METIERS_SEO } from "@/lib/metiers-seo";
import { slugify } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://artisanrdv.com";

  const pagesStatiques: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/recherche`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pour-les-artisans`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tarifs`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const pagesMetiers: MetadataRoute.Sitemap = METIERS_SEO.map((m) => ({
    url: `${base}/artisans/${m.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  try {
    const supabase = await createClient();
    const { data: entreprises } = await supabase.from("entreprises").select("slug, metier, ville").limit(5000);

    const pagesEntreprises: MetadataRoute.Sitemap = (entreprises ?? []).map((e) => ({
      url: `${base}/e/${e.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const combosVues = new Set<string>();
    const pagesMetierVille: MetadataRoute.Sitemap = [];
    for (const e of entreprises ?? []) {
      if (!e.ville?.trim()) continue;
      const metier = METIERS_SEO.find((m) => m.valeur === e.metier);
      if (!metier) continue;
      const cle = `${metier.slug}/${slugify(e.ville)}`;
      if (combosVues.has(cle)) continue;
      combosVues.add(cle);
      pagesMetierVille.push({ url: `${base}/artisans/${cle}`, changeFrequency: "weekly", priority: 0.65 });
    }

    return [...pagesStatiques, ...pagesMetiers, ...pagesMetierVille, ...pagesEntreprises];
  } catch {
    return [...pagesStatiques, ...pagesMetiers];
  }
}
