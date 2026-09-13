"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export type EtatFormulaire = { error?: string } | null;

export async function inscriptionAction(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  const email = String(formData.get("email") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const nomEntreprise = String(formData.get("nomEntreprise") ?? "").trim();
  const metier = String(formData.get("metier") ?? "").trim();
  const ville = String(formData.get("ville") ?? "").trim();
  const codePostal = String(formData.get("codePostal") ?? "").trim();
  const adresse = String(formData.get("adresse") ?? "").trim();
  const telephone = String(formData.get("telephone") ?? "").trim() || phone;
  const nbSalaries = Number(formData.get("nbSalaries") ?? 1) || 1;

  if (!email || motDePasse.length < 8) {
    return { error: "Mot de passe trop court (8 caractères minimum)." };
  }
  if (!nomEntreprise) {
    return { error: "Le nom de votre entreprise est requis." };
  }

  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    options: { data: { full_name: fullName, phone } },
  });

  if (signUpError) {
    return {
      error: signUpError.message.includes("already registered")
        ? "Un compte existe déjà avec cet e-mail."
        : signUpError.message,
    };
  }

  if (!signUpData.session) {
    return {
      error:
        "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.",
    };
  }

  const { data: entreprise, error: entrepriseError } = await supabase.rpc("creer_entreprise", {
    p_nom: nomEntreprise,
    p_slug: slugify(nomEntreprise),
    p_metier: (metier || null) as string,
    p_ville: (ville || null) as string,
    p_code_postal: (codePostal || null) as string,
    p_adresse: (adresse || null) as string,
    p_telephone: (telephone || null) as string,
    p_nb_salaries: nbSalaries,
  });

  if (entrepriseError || !entreprise) {
    return { error: entrepriseError?.message ?? "Impossible de créer l'entreprise." };
  }

  redirect("/dashboard");
}
