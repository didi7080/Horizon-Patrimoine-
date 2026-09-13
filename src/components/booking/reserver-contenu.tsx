import { notFound } from "next/navigation";
import { ReservationStepper } from "@/components/booking/reservation-stepper";
import { createClient } from "@/lib/supabase/server";

export async function ReserverContenu({
  slug,
  prestationId,
  embed = false,
}: {
  slug: string;
  prestationId: string;
  embed?: boolean;
}) {
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
    <ReservationStepper
      entreprise={entreprise}
      prestation={prestation}
      salaries={salaries}
      embed={embed}
    />
  );
}
