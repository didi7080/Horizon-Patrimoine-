"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adresseIp, limiteAtteinte } from "@/lib/rate-limit";

export type EtatFormulaire = { error?: string } | null;

export async function connexionAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!email || !motDePasse) {
    return { error: "Merci de renseigner votre e-mail et votre mot de passe." };
  }

  const ip = await adresseIp();
  if (await limiteAtteinte(`connexion:${ip}`)) {
    return { error: "Trop de tentatives depuis votre connexion. Réessayez dans quelques minutes." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  if (error) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}
