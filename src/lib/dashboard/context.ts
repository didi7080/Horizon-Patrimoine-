import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planEffectif, type Plan } from "@/lib/stripe";
import type { Tables } from "@/lib/types/database";

export type EntrepriseContext = {
  userId: string;
  role: Tables<"memberships">["role"];
  entreprise: Tables<"entreprises">;
};

export async function getEntrepriseContext(): Promise<EntrepriseContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, entreprise:entreprises(*)")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.entreprise) redirect("/inscription");

  return { userId: user.id, role: membership.role, entreprise: membership.entreprise };
}

/** Formule effective d'une entreprise (choisie via l'abonnement, sinon suggérée par l'effectif). */
export async function planActuelEntreprise(entrepriseId: string, nbSalaries: number): Promise<Plan> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("abonnements")
    .select("plan")
    .eq("entreprise_id", entrepriseId)
    .maybeSingle();
  return planEffectif(data?.plan, nbSalaries);
}
