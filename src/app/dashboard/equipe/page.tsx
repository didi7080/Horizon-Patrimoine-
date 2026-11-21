import { Suspense } from "react";
import Link from "next/link";
import { Lock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SalarieFormDialog } from "@/components/dashboard/salarie-form-dialog";
import { HorairesEditor } from "@/components/dashboard/horaires-editor";
import { InviteMembreDialog } from "@/components/dashboard/invite-membre-dialog";
import { IcalLinkButton } from "@/components/dashboard/ical-link-button";
import { GoogleCalendarButton } from "@/components/dashboard/google-calendar-button";
import { GoogleCalendarStatut } from "@/components/dashboard/google-calendar-statut";
import { initiales } from "@/lib/utils";
import { getEntrepriseContext, planActuelEntreprise } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { accesInvitationMembres } from "@/lib/stripe";
import { toggleSalarieActif } from "@/app/dashboard/actions";
import { revoquerMembre } from "@/app/dashboard/equipe/invite-actions";
import type { Tables } from "@/lib/types/database";

export const revalidate = 0;

const LABEL_ROLE: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  salarie: "Salarié",
};

type SalarieAvecHoraires = Tables<"salaries"> & { horaires: Tables<"horaires">[] };

type PersonneEquipe = {
  cle: string;
  nom: string;
  email: string | null;
  role: string | null;
  membershipId: string | null;
  estSoiMeme: boolean;
  salarie: SalarieAvecHoraires | null;
};

export default async function EquipePage() {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = await createClient();
  const plan = await planActuelEntreprise(entreprise.id, entreprise.nb_salaries);
  const peutInviter = accesInvitationMembres(plan, entreprise.nb_salaries);

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

  // Une personne peut avoir un accès de connexion (membership), une fiche planning (salarié), ou les deux :
  // on les réunit en une seule liste par personne plutôt que deux listes séparées sans lien visible entre elles.
  const salariesParProfil = new Map<string, SalarieAvecHoraires>();
  for (const s of salaries ?? []) {
    if (s.profile_id) salariesParProfil.set(s.profile_id, s);
  }

  const personnesAvecAcces: PersonneEquipe[] = membresAvecEmail.map((m) => ({
    cle: m.id,
    nom: salariesParProfil.get(m.profile_id)?.nom ?? m.email ?? "Membre",
    email: m.email,
    role: m.role,
    membershipId: m.id,
    estSoiMeme: m.profile_id === userId,
    salarie: salariesParProfil.get(m.profile_id) ?? null,
  }));

  const profilsAvecAcces = new Set(membresAvecEmail.map((m) => m.profile_id));
  const personnesSansAcces: PersonneEquipe[] = (salaries ?? [])
    .filter((s) => !s.profile_id || !profilsAvecAcces.has(s.profile_id))
    .map((s) => ({
      cle: s.id,
      nom: s.nom,
      email: null,
      role: null,
      membershipId: null,
      estSoiMeme: false,
      salarie: s as SalarieAvecHoraires,
    }));

  const personnes = [...personnesAvecAcces, ...personnesSansAcces].sort((a, b) => a.nom.localeCompare(b.nom));
  const salariesSansAcces = personnesSansAcces
    .filter((p) => p.salarie)
    .map((p) => ({ id: p.salarie!.id, nom: p.salarie!.nom }));

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <GoogleCalendarStatut />
      </Suspense>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Équipe</h1>
          <p className="mt-1 text-muted">Vos salariés, leurs horaires, et l’accès au tableau de bord.</p>
        </div>
        <div className="flex gap-2">
          <SalarieFormDialog />
          {peutInviter ? (
            <InviteMembreDialog salariesSansAcces={salariesSansAcces} />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/reglages">
                <Lock className="size-3.5" /> Inviter un membre — formule Équipe
              </Link>
            </Button>
          )}
        </div>
      </div>

      {personnes.length > 0 ? (
        <div className="space-y-4">
          {personnes.map((p) => (
            <Card key={p.cle} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback
                      style={{ backgroundColor: `${p.salarie?.couleur ?? "#94a3b8"}22`, color: p.salarie?.couleur ?? "#64748b" }}
                    >
                      {initiales(p.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{p.nom}</p>
                      {p.role && (
                        <Badge variant="neutral" className="capitalize">
                          {LABEL_ROLE[p.role] ?? p.role}
                        </Badge>
                      )}
                      {p.salarie && !p.salarie.actif && <Badge variant="neutral">Inactif</Badge>}
                    </div>
                    {p.email && <p className="text-sm text-muted">{p.email}</p>}
                    {p.salarie?.fonction && <p className="text-sm text-muted">{p.salarie.fonction}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.salarie && (
                    <>
                      <IcalLinkButton token={p.salarie.ical_token} />
                      <GoogleCalendarButton salarieId={p.salarie.id} emailConnecte={p.salarie.google_email} />
                      <form action={async () => { "use server"; await toggleSalarieActif(p.salarie!.id, !p.salarie!.actif); }}>
                        <Button size="sm" variant="ghost" type="submit">
                          {p.salarie.actif ? "Désactiver" : "Réactiver"}
                        </Button>
                      </form>
                      <SalarieFormDialog salarie={p.salarie} />
                    </>
                  )}
                  {!p.membershipId && p.salarie && (
                    peutInviter ? (
                      <InviteMembreDialog
                        salariesSansAcces={salariesSansAcces}
                        salarieParDefaut={{ id: p.salarie.id, nom: p.salarie.nom }}
                        libelleBouton="Donner un accès"
                        tailleBouton="sm"
                      />
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/reglages">
                          <Lock className="size-3.5" /> Accès — formule Équipe
                        </Link>
                      </Button>
                    )
                  )}
                  {p.membershipId && !p.estSoiMeme && p.role !== "owner" && (
                    <form action={async () => { "use server"; await revoquerMembre(p.membershipId!); }}>
                      <Button size="sm" variant="ghost" type="submit">
                        <X className="size-3.5" /> Retirer l’accès
                      </Button>
                    </form>
                  )}
                </div>
              </div>
              {p.salarie && (
                <>
                  <Separator className="my-4" />
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Horaires de travail
                  </p>
                  <HorairesEditor salarieId={p.salarie.id} horaires={p.salarie.horaires} />
                </>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center text-sm text-muted">
          Ajoutez les membres de votre équipe pour répartir les rendez-vous.
        </Card>
      )}

      {!admin && (
        <p className="text-xs text-muted-foreground">
          Les e-mails et les invitations ne sont pas disponibles sur cette installation.
        </p>
      )}
    </div>
  );
}
