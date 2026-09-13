import Link from "next/link";
import { RdvRow, type RdvAvecRelations } from "@/components/dashboard/rdv-row";
import { Card } from "@/components/ui/card";
import { cn, formatDateLongue } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

const ONGLETS = [
  { value: "a-venir", label: "À venir" },
  { value: "demandes", label: "Demandes" },
  { value: "passes", label: "Passés" },
  { value: "annules", label: "Annulés" },
] as const;

export default async function RendezVousPage({
  searchParams,
}: PageProps<"/dashboard/rendez-vous">) {
  const params = await searchParams;
  const onglet = typeof params.vue === "string" ? params.vue : "a-venir";
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const selectRdv = "*, prestations(nom), salaries(nom, couleur), clients(nom, telephone)";
  let query = supabase
    .from("rendez_vous")
    .select(selectRdv)
    .eq("entreprise_id", entreprise.id);

  const maintenant = new Date().toISOString();

  if (onglet === "a-venir") {
    query = query.eq("statut", "confirme").gte("debut", maintenant).order("debut");
  } else if (onglet === "demandes") {
    query = query.eq("statut", "demande").order("debut");
  } else if (onglet === "passes") {
    query = query.in("statut", ["confirme", "honore", "absent"]).lt("debut", maintenant).order("debut", { ascending: false });
  } else {
    query = query.eq("statut", "annule").order("debut", { ascending: false });
  }

  const { data: rdvs } = await query.limit(100);
  const liste = (rdvs ?? []) as RdvAvecRelations[];

  const groupes = new Map<string, RdvAvecRelations[]>();
  for (const rdv of liste) {
    const cle = formatDateLongue(rdv.debut);
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle)!.push(rdv);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Rendez-vous</h1>
        <p className="mt-1 text-muted">Tous les rendez-vous de {entreprise.nom}.</p>
      </div>

      <div className="inline-flex gap-1 rounded-lg bg-background p-1 shadow-sm">
        {ONGLETS.map((o) => (
          <Link
            key={o.value}
            href={`/dashboard/rendez-vous?vue=${o.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              onglet === o.value ? "bg-brand-light text-brand-dark" : "text-muted hover:text-foreground",
            )}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {groupes.size === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">Aucun rendez-vous ici.</Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupes.entries()).map(([date, rdvsDuJour]) => (
            <section key={date}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">{date}</h2>
              <div className="space-y-2">
                {rdvsDuJour.map((rdv) => (
                  <RdvRow key={rdv.id} rdv={rdv} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
