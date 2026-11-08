import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoutonSupprimer } from "@/components/dashboard/outils/bouton-supprimer";
import { DepenseFormDialog } from "@/components/dashboard/depenses/depense-form-dialog";
import { ValidationDepenseBoutons } from "@/components/dashboard/depenses/validation-depense-boutons";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { bornesMois, moisCourant, libelleMois } from "@/lib/bilan/types";
import { formatPrix, formatDateCourte } from "@/lib/utils";
import { supprimerDepense, urlJustificatif } from "@/app/dashboard/depenses/actions";
import type { Tables } from "@/lib/types/database";

export const revalidate = 0;

const LABEL_STATUT: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  en_attente: { label: "En attente", variant: "warning" },
  validee: { label: "Validée", variant: "success" },
  refusee: { label: "Refusée", variant: "danger" },
};

type Depense = Tables<"depenses">;

async function nomsAuteurs(admin: ReturnType<typeof createAdminClient>, ids: string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(ids)];
  if (!admin || uniques.length === 0) return new Map();
  const { data } = await admin.from("profiles").select("id, full_name").in("id", uniques);
  return new Map((data ?? []).map((p) => [p.id, p.full_name ?? "Un membre de l'équipe"]));
}

async function avecPhotos(depenses: Depense[]): Promise<Map<string, string>> {
  const avecJustificatif = depenses.filter((d) => d.justificatif_path);
  const urls = await Promise.all(avecJustificatif.map((d) => urlJustificatif(d.justificatif_path!)));
  const map = new Map<string, string>();
  avecJustificatif.forEach((d, i) => {
    const url = urls[i];
    if (url) map.set(d.id, url);
  });
  return map;
}

export default async function DepensesPage({ searchParams }: PageProps<"/dashboard/depenses">) {
  const { mois: moisParam } = await searchParams;
  const mois = (Array.isArray(moisParam) ? moisParam[0] : moisParam) || moisCourant();
  const { entreprise, role, userId } = await getEntrepriseContext();
  const admin = createAdminClient();
  const estSalarie = role === "salarie";

  if (estSalarie) {
    const { data } = admin
      ? await admin
          .from("depenses")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .eq("created_by", userId)
          .order("created_at", { ascending: false })
      : { data: null };
    const mesDepenses = data ?? [];
    const photos = await avecPhotos(mesDepenses);

    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Mes notes de frais</h1>
            <p className="mt-1 text-muted">
              Envoyez vos dépenses avec une photo du ticket ; le gérant les valide avant qu&apos;elles ne soient
              comptées.
            </p>
          </div>
          <DepenseFormDialog estSalarie />
        </div>

        <div className="space-y-2">
          {mesDepenses.length > 0 ? (
            mesDepenses.map((d) => (
              <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {photos.get(d.id) && (
                    <Link href={photos.get(d.id)!} target="_blank">
                      <img src={photos.get(d.id)} alt="Justificatif" className="size-12 rounded-md border border-border object-cover" />
                    </Link>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {d.categorie} · {formatPrix(d.montant_cents)}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateCourte(d.date)}
                      {d.description ? ` · ${d.description}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={LABEL_STATUT[d.statut].variant}>{LABEL_STATUT[d.statut].label}</Badge>
                  {d.statut === "en_attente" && (
                    <BoutonSupprimer confirmation="Retirer cette note de frais ?" action={supprimerDepense.bind(null, d.id)} />
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-sm text-muted">Aucune note de frais envoyée pour le moment.</Card>
          )}
        </div>
      </div>
    );
  }

  const { debut, fin } = bornesMois(mois);
  const [{ data: depensesMois }, { data: enAttente }] = admin
    ? await Promise.all([
        admin
          .from("depenses")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .eq("statut", "validee")
          .gte("date", debut)
          .lt("date", fin)
          .order("date", { ascending: false }),
        admin
          .from("depenses")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .eq("statut", "en_attente")
          .order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }];

  const liste = depensesMois ?? [];
  const attente = enAttente ?? [];
  const total = liste.reduce((s, d) => s + d.montant_cents, 0);
  const parCategorie = new Map<string, number>();
  for (const d of liste) {
    parCategorie.set(d.categorie, (parCategorie.get(d.categorie) ?? 0) + d.montant_cents);
  }

  const auteurs = await nomsAuteurs(admin, attente.map((d) => d.created_by).filter((id): id is string => Boolean(id)));
  const photosAttente = await avecPhotos(attente);
  const photosListe = await avecPhotos(liste);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dépenses</h1>
          <p className="mt-1 text-muted">Vos charges et frais professionnels, mois par mois.</p>
        </div>
        <DepenseFormDialog />
      </div>

      {attente.length > 0 && (
        <Card className="space-y-3 border-warning/30 bg-warning-light p-5">
          <p className="font-medium text-foreground">
            {attente.length} note{attente.length > 1 ? "s" : ""} de frais à valider
          </p>
          <div className="space-y-2">
            {attente.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background p-3">
                <div className="flex items-center gap-3">
                  {photosAttente.get(d.id) && (
                    <Link href={photosAttente.get(d.id)!} target="_blank">
                      <img
                        src={photosAttente.get(d.id)}
                        alt="Justificatif"
                        className="size-12 rounded-md border border-border object-cover"
                      />
                    </Link>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {d.categorie} · {formatPrix(d.montant_cents)}
                    </p>
                    <p className="text-sm text-muted">
                      {auteurs.get(d.created_by ?? "") ?? "Un membre de l'équipe"} · {formatDateCourte(d.date)}
                      {d.description ? ` · ${d.description}` : ""}
                    </p>
                  </div>
                </div>
                <ValidationDepenseBoutons id={d.id} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <form method="get" className="flex items-center gap-2">
        <input
          type="month"
          name="mois"
          defaultValue={mois}
          className="h-10 rounded-lg border border-border-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
        />
        <Button type="submit" variant="outline" size="sm">
          Afficher
        </Button>
      </form>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="font-medium capitalize text-foreground">{libelleMois(mois)}</p>
          <p className="text-lg font-semibold text-foreground">Total : {formatPrix(total)}</p>
        </div>
        {parCategorie.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {[...parCategorie.entries()].map(([categorie, montant]) => (
              <Badge key={categorie} variant="neutral">
                {categorie} · {formatPrix(montant)}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {liste.length > 0 ? (
          liste.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {photosListe.get(d.id) && (
                  <Link href={photosListe.get(d.id)!} target="_blank">
                    <img
                      src={photosListe.get(d.id)}
                      alt="Justificatif"
                      className="size-12 rounded-md border border-border object-cover"
                    />
                  </Link>
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {d.categorie} · {formatPrix(d.montant_cents)}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateCourte(d.date)}
                    {d.description ? ` · ${d.description}` : ""}
                  </p>
                </div>
              </div>
              <BoutonSupprimer confirmation="Supprimer cette dépense ?" action={supprimerDepense.bind(null, d.id)} />
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-muted">Aucune dépense enregistrée ce mois-ci.</Card>
        )}
      </div>
    </div>
  );
}
