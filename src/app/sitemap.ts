import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://artisanrdv.fr";

  const pagesStatiques: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/recherche`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/pour-les-artisans`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/tarifs`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = await createClient();
    const { data: entreprises } = await supabase.from("entreprises").select("slug").limit(5000);
    const pagesEntreprises: MetadataRoute.Sitemap = (entreprises ?? []).map((e) => ({
      url: `${base}/e/${e.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...pagesStatiques, ...pagesEntreprises];
  } catch {
    return pagesStatiques;
  }
}
