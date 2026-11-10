"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getEntrepriseContext, planActuelEntreprise } from "@/lib/dashboard/context";
import { accesInvitationMembres } from "@/lib/stripe";
import type { Enums } from "@/lib/types/database";

export type EtatInvitation = { error?: string; success?: boolean } | null;

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

export async function inviterMembre(
  _etat: EtatInvitation,
  formData: FormData,
): Promise<EtatInvitation> {
  const { entreprise, role: monRole } = await getEntrepriseContext();

  if (monRole !== "owner" && monRole !== "admin") {
    return { error: "Seul un administrateur peut inviter un membre." };
  }

  const plan = await planActuelEntreprise(entreprise.id, entreprise.nb_salaries);
  if (!accesInvitationMembres(plan, entreprise.nb_salaries)) {
    return { error: "L'invitation de membres est réservée à la formule Équipe." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "L'invitation par e-mail nécessite la configuration de SUPABASE_SERVICE_ROLE_KEY par l'administrateur ArtisanRDV.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "salarie") as Enums<"role_membre">;
  const salarieId = String(formData.get("salarie_id") ?? "").trim() || null;

  if (!email || !email.includes("@")) {
    return { error: "Adresse e-mail invalide." };
  }
  if (role !== "admin" && role !== "salarie") {
    return { error: "Rôle invalide." };
  }

  const base = await origine();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${base}/dashboard`,
    data: { full_name: String(formData.get("nom") ?? "").trim() || null },
  });

  if (error) {
    return {
      error: error.message.includes("already registered")
        ? "Cette personne a déjà un compte ArtisanRDV."
        : error.message,
    };
  }

  const profileId = data.user.id;
  const supabase = await createClient();

  const { error: erreurMembership } = await supabase
    .from("memberships")
    .insert({ entreprise_id: entreprise.id, profile_id: profileId, role });

  if (erreurMembership) {
    return { error: erreurMembership.message };
  }

  if (salarieId) {
    await supabase
      .from("salaries")
      .update({ profile_id: profileId })
      .eq("id", salarieId)
      .eq("entreprise_id", entreprise.id);
  }

  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function revoquerMembre(membershipId: string): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const { role: monRole } = await getEntrepriseContext();
  try {
    if (monRole !== "owner" && monRole !== "admin") {
      throw new Error("Seul un administrateur peut retirer un membre.");
    }
    const supabase = await createClient();
    const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
