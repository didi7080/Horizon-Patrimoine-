import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ReservationStepper } from "@/components/booking/reservation-stepper";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function ReserverPage({
  params,
}: PageProps<"/e/[slug]/reserver/[prestationId]">) {
  const { slug, prestationId } = await params;
  const supabase = await createClient();

  const { data: entreprise } = await supabase
    .from("entreprises")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!entreprise) notFound();

  const { data: prestation } = await supabase
    .from("prestations")
    .select("*")
    .eq("id", prestationId)
    .eq("entreprise_id", entreprise.id)
    .eq("actif", true)
    .maybeSingle();

  if (!prestation) notFound();

  const { data: liaisons } = await supabase
    .from("prestation_salaries")
    .select("salarie_id, salaries(id, nom, fonction, couleur, actif)")
    .eq("prestation_id", prestation.id);

  const salaries = (liaisons ?? [])
    .map((l) => l.salaries)
    .filter((s): s is NonNullable<typeof s> => !!s && s.actif);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <ReservationStepper entreprise={entreprise} prestation={prestation} salaries={salaries} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
