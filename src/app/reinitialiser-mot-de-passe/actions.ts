"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatFormulaire = { error?: string } | null;

export async function reinitialiserMotDePasseAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (motDePasse.length < 8) {
    return { error: "Mot de passe trop court (8 caractères minimum)." };
  }
  if (motDePasse !== confirmation) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Votre lien a expiré. Demandez un nouveau lien de réinitialisation." };
  }

  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
