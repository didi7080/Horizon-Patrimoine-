import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SalarieFormDialog } from "@/components/dashboard/salarie-form-dialog";
import { HorairesEditor } from "@/components/dashboard/horaires-editor";
import { initiales } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { toggleSalarieActif } from "@/app/dashboard/actions";

export const revalidate = 0;

export default async function EquipePage() {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const { data: salaries } = await supabase
    .from("salaries")
    .select("*, horaires(*)")
    .eq("entreprise_id", entreprise.id)
    .order("created_at");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Équipe</h1>
          <p className="mt-1 text-muted">Vos salariés et leurs horaires de disponibilité.</p>
        </div>
        <SalarieFormDialog />
      </div>

      <div className="space-y-4">
        {salaries && salaries.length > 0 ? (
          salaries.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback style={{ backgroundColor: `${s.couleur}22`, color: s.couleur }}>
                      {initiales(s.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{s.nom}</p>
                      {!s.actif && <Badge variant="neutral">Inactif</Badge>}
                    </div>
                    {s.fonction && <p className="text-sm text-muted">{s.fonction}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={toggleSalarieActif.bind(null, s.id, !s.actif)}>
                    <Button size="sm" variant="ghost" type="submit">
                      {s.actif ? "Désactiver" : "Réactiver"}
                    </Button>
                  </form>
                  <SalarieFormDialog salarie={s} />
                </div>
              </div>
              <Separator className="my-4" />
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Horaires de travail
              </p>
              <HorairesEditor salarieId={s.id} horaires={s.horaires} />
            </Card>
          ))
        ) : (
          <Card className="p-10 text-center text-sm text-muted">
            Ajoutez les membres de votre équipe pour répartir les rendez-vous.
          </Card>
        )}
      </div>
    </div>
  );
}
