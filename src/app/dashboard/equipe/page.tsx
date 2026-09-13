import { ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SalarieFormDialog } from "@/components/dashboard/salarie-form-dialog";
import { HorairesEditor } from "@/components/dashboard/horaires-editor";
import { InviteMembreDialog } from "@/components/dashboard/invite-membre-dialog";
import { initiales } from "@/lib/utils";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleSalarieActif } from "@/app/dashboard/actions";
import { revoquerMembre } from "@/app/dashboard/equipe/invite-actions";

export const revalidate = 0;

const LABEL_ROLE: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  salarie: "Salarié",
};

export default async function EquipePage() {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = await createClient();

  const [{ data: salaries }, { data: memberships }] = await Promise.all([
    supabase.from("salaries").select("*, horaires(*)").eq("entreprise_id", entreprise.id).order("created_at"),
    supabase
      .from("memberships")
      .select("id, profile_id, role, created_at")
      .eq("entreprise_id", entreprise.id)
      .order("created_at"),
  ]);

  const admin = createAdminClient();
  const membresAvecEmail = await Promise.all(
    (memberships ?? []).map(async (m) => {
      if (!admin) return { ...m, email: null as string | null };
      const { data } = await admin.auth.admin.getUserById(m.profile_id);
      return { ...m, email: data.user?.email ?? null };
    }),
  );

  const salariesSansAcces = (salaries ?? [])
    .filter((s) => !s.profile_id)
    .map((s) => ({ id: s.id, nom: s.nom }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Équipe</h1>
        <p className="mt-1 text-muted">Vos salariés, leurs horaires, et l’accès au tableau de bord.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldCheck className="size-4 text-brand" /> Accès au tableau de bord
          </h2>
          <InviteMembreDialog salariesSansAcces={salariesSansAcces} />
        </div>
        <div className="space-y-2">
          {membresAvecEmail.map((m) => (
            <Card key={m.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {m.email ?? "Adresse e-mail non disponible"}
                </p>
                <Badge variant="neutral" className="mt-1 capitalize">
                  {LABEL_ROLE[m.role] ?? m.role}
                </Badge>
              </div>
              {m.profile_id !== userId && m.role !== "owner" && (
                <form action={revoquerMembre.bind(null, m.id)}>
                  <Button size="sm" variant="ghost" type="submit">
                    <X className="size-3.5" /> Retirer
                  </Button>
                </form>
              )}
            </Card>
          ))}
        </div>
        {!admin && (
          <p className="text-xs text-muted-foreground">
            Configurez SUPABASE_SERVICE_ROLE_KEY pour afficher les e-mails et activer les
            invitations.
          </p>
        )}
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Salariés et horaires</h2>
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
      </section>
    </div>
  );
}
