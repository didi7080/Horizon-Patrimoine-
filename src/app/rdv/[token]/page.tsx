import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { GestionRdv } from "@/components/booking/gestion-rdv";
import { createClient } from "@/lib/supabase/server";
import { facturationConfiguree } from "@/lib/stripe";
import type { Json } from "@/lib/types/database";

export const revalidate = 0;

export type RdvDetail = {
  statut: "confirme" | "annule" | "honore" | "absent" | "demande";
  debut: string;
  fin: string;
  notes: string | null;
  champs_perso: Json;
  adresse_client: string | null;
  prestation_id: string | null;
  salarie_id: string;
  entreprise_id: string;
  prestation_nom: string | null;
  prestation_duree: number | null;
  acompte_cents: number | null;
  acompte_paye: boolean;
  salarie_nom: string | null;
  entreprise_nom: string;
  entreprise_slug: string;
  entreprise_tel: string | null;
  entreprise_logo: string | null;
  entreprise_couleur: string;
  avis_actif: boolean;
  a_un_avis: boolean;
  client_nom: string | null;
};

export default async function RdvTokenPage({ params }: PageProps<"/rdv/[token]">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("rdv_par_token", { p_token: token });
  const rdv = data as RdvDetail | null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
          {rdv ? (
            <GestionRdv token={token} initial={rdv} facturationPrete={facturationConfiguree()} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
              <p className="font-medium text-foreground">Rendez-vous introuvable</p>
              <p className="mt-1 text-sm text-muted">
                Ce lien n’est plus valide. Vérifiez l’e-mail ou le SMS de confirmation.
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
