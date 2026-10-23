import Link from "next/link";
import { Calculator, ListChecks, Package, Pencil, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { modelesPourMetier } from "@/lib/calculs/modeles";
import { CreerDepuisModeleBouton } from "@/components/dashboard/outils/creer-depuis-modele-bouton";
import { BoutonSupprimer } from "@/components/dashboard/outils/bouton-supprimer";
import { supprimerModule } from "@/app/dashboard/outils/actions";
import type { Champ } from "@/lib/calculs/types";

export const revalidate = 0;

export default async function OutilsPage() {
  const { entreprise } = await getEntrepriseContext();
  const admin = createAdminClient();

  const { data: modules } = admin
    ? await admin
        .from("modules_calcul")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("ordre")
        .order("created_at")
    : { data: null };

  const modulesExistants = modules ?? [];
  const nomsExistants = new Set(modulesExistants.map((m) => m.nom));
  const modeles = modelesPourMetier(entreprise.metier).filter((m) => !nomsExistants.has(m.nom));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Outils de calcul</h1>
          <p className="mt-1 text-muted">
            Vos propres modules de calcul pour vos études chantier, adaptés à votre métier
            {entreprise.metier ? ` (${entreprise.metier})` : ""}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/outils/materiel">
              <Package className="size-4" /> Catalogue matériel
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/outils/etudes">
              <ListChecks className="size-4" /> Mes études
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Mes modules</h2>
          <Button asChild size="sm">
            <Link href="/dashboard/outils/modules/nouveau">
              <Plus className="size-3.5" /> Créer un module personnalisé
            </Link>
          </Button>
        </div>

        {modulesExistants.length > 0 ? (
          <div className="space-y-3">
            {modulesExistants.map((m) => {
              const champs = (m.champs as Champ[]) ?? [];
              return (
                <Card key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="size-5 text-brand" />
                    <div>
                      <p className="font-medium text-foreground">{m.nom}</p>
                      <p className="text-sm text-muted">{champs.length} champ(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/outils/modules/${m.id}`}>
                        <Pencil className="size-3.5" /> Modifier
                      </Link>
                    </Button>
                    <BoutonSupprimer
                      confirmation={`Supprimer le module "${m.nom}" ? Les études existantes qui l'utilisent conserveront leurs données mais ne pourront plus s'y référer.`}
                      action={supprimerModule.bind(null, m.id)}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Aucun module pour le moment. Ajoutez un modèle ci-dessous ou créez le vôtre.
          </Card>
        )}
      </section>

      {modeles.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-medium text-foreground">Modèles suggérés pour votre métier</h2>
            <p className="text-sm text-muted">
              Des points de départ que vous pourrez ensuite modifier librement — formules, champs, valeurs par défaut.
            </p>
          </div>
          <div className="space-y-3">
            {modeles.map((modele) => (
              <Card key={modele.nom} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{modele.nom}</p>
                    <Badge variant="neutral">{modele.formules.length} formule(s)</Badge>
                  </div>
                  <p className="text-sm text-muted">{modele.champs.length} champ(s) à renseigner</p>
                </div>
                <CreerDepuisModeleBouton nomModele={modele.nom} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
