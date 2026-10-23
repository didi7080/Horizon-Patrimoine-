import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { EtudeEditeur } from "@/components/dashboard/outils/etude-editeur";
import { BoutonSupprimer } from "@/components/dashboard/outils/bouton-supprimer";
import { supprimerEtude } from "@/app/dashboard/outils/actions";
import type { Champ, DonneesEtude, Formule, LigneMateriel } from "@/lib/calculs/types";

export const revalidate = 0;

export default async function EtudeDetailPage({ params }: PageProps<"/dashboard/outils/etudes/[id]">) {
  const { id } = await params;
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: etude } = await admin
    .from("etudes")
    .select("*, module:modules_calcul(id, nom, champs, formules)")
    .eq("id", id)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (!etude) notFound();

  const { data: catalogue } = await admin
    .from("materiel_catalogue")
    .select("id, designation, unite, prix_achat_cents, coefficient")
    .eq("entreprise_id", entreprise.id)
    .eq("actif", true)
    .order("designation");

  const donnees = (etude.donnees as DonneesEtude) ?? {};
  const module_ = etude.module as { id: string; nom: string; champs: Champ[]; formules: Formule[] } | null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/outils/etudes" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Retour aux études
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/outils/etudes/${id}/presentation`} target="_blank">
              <Printer className="size-3.5" /> Présentation client
            </Link>
          </Button>
          <BoutonSupprimer
            confirmation={`Supprimer définitivement l'étude "${etude.titre}" ?`}
            action={supprimerEtude.bind(null, id)}
          />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">{etude.titre}</h1>
        {(etude.client_nom || etude.client_adresse || etude.client_telephone) && (
          <p className="mt-1 text-muted">
            {[etude.client_nom, etude.client_adresse, etude.client_telephone].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      {!module_ && (
        <Card className="p-4 text-sm text-muted">
          Aucun module de calcul n’a été choisi pour cette étude.{" "}
          <Link href="/dashboard/outils" className="font-medium text-brand hover:underline">
            Créez-en un
          </Link>{" "}
          puis recréez l’étude en le sélectionnant.
        </Card>
      )}

      <EtudeEditeur
        etudeId={id}
        statutInitial={etude.statut}
        moduleNom={module_?.nom ?? null}
        moduleChamps={module_?.champs ?? []}
        moduleFormules={module_?.formules ?? []}
        valeursInitiales={donnees.champs ?? {}}
        materielInitial={donnees.materiel ?? ([] as LigneMateriel[])}
        syntheseInitiale={donnees.synthese ?? ""}
        catalogue={catalogue ?? []}
      />
    </div>
  );
}
