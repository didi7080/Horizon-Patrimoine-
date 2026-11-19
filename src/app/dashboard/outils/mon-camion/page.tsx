import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrendrePieceForm, ReapprovisionnerForm } from "@/components/dashboard/outils/camion-actions";

export const revalidate = 0;

export default async function MonCamionPage() {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: monSalarie } = await supabase
    .from("salaries")
    .select("id, nom")
    .eq("entreprise_id", entreprise.id)
    .eq("profile_id", userId)
    .maybeSingle();

  const admin = createAdminClient();

  const [{ data: articles }, { data: chantiersEnCours }] = admin
    ? await Promise.all([
        admin
          .from("materiel_catalogue")
          .select("id, designation, unite")
          .eq("entreprise_id", entreprise.id)
          .eq("actif", true)
          .order("designation"),
        supabase
          .from("chantiers")
          .select("id, titre, clients(nom)")
          .eq("entreprise_id", entreprise.id)
          .eq("statut", "en_cours")
          .order("titre"),
      ])
    : [{ data: null }, { data: null }];

  const articlesListe = articles ?? [];
  const chantiersListe = (chantiersEnCours ?? []).map((c) => ({ id: c.id, titre: `${c.titre} — ${c.clients?.nom ?? ""}` }));

  let stockCamion: { materiel_id: string; quantite: number }[] = [];
  let stockDepot: { materiel_id: string; quantite: number }[] = [];
  if (admin && monSalarie) {
    const [{ data: camion }, { data: depot }] = await Promise.all([
      admin.from("stocks").select("materiel_id, quantite").eq("entreprise_id", entreprise.id).eq("salarie_id", monSalarie.id),
      admin.from("stocks").select("materiel_id, quantite").eq("entreprise_id", entreprise.id).is("salarie_id", null),
    ]);
    stockCamion = camion ?? [];
    stockDepot = depot ?? [];
  }

  const camionParId = new Map(stockCamion.map((s) => [s.materiel_id, s.quantite]));
  const depotParId = new Map(stockDepot.map((s) => [s.materiel_id, s.quantite]));
  const articlesAvecStock = articlesListe.filter(
    (a) => (camionParId.get(a.id) ?? 0) !== 0 || (depotParId.get(a.id) ?? 0) !== 0,
  );

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/outils" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux outils de calcul
      </Link>
      <div className="flex items-center gap-2">
        <Truck className="size-6 text-brand" />
        <h1 className="text-2xl font-semibold text-foreground">Mon camion</h1>
      </div>

      {!monSalarie ? (
        <Card className="p-6 text-sm text-muted">
          Votre compte n’est pas rattaché à une fiche salarié de l’équipe, donc pas de stock camion personnel à suivre ici.
        </Card>
      ) : articlesListe.length === 0 ? (
        <Card className="p-6 text-sm text-muted">
          Aucune pièce dans le{" "}
          <Link href="/dashboard/outils/materiel" className="font-medium text-brand hover:underline">
            catalogue matériel
          </Link>{" "}
          pour le moment.
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <PrendrePieceForm articles={articlesListe} salarieId={monSalarie.id} chantiers={chantiersListe} />
            <ReapprovisionnerForm articles={articlesListe} salarieId={monSalarie.id} />
          </div>

          <Card className="space-y-3 p-4">
            <h2 className="font-medium text-foreground">Mon stock actuel</h2>
            {articlesAvecStock.length === 0 ? (
              <p className="text-sm text-muted">Aucun mouvement enregistré pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {articlesAvecStock.map((a) => {
                  const qteCamion = camionParId.get(a.id) ?? 0;
                  const qteDepot = depotParId.get(a.id) ?? 0;
                  return (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface p-3 text-sm">
                      <span className="font-medium text-foreground">{a.designation}</span>
                      <span className="flex gap-4 text-muted">
                        <span>
                          Mon camion : <span className="font-semibold text-foreground">{qteCamion}</span> {a.unite}
                        </span>
                        <span>
                          Dépôt : <span className="font-semibold text-foreground">{qteDepot}</span> {a.unite}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
