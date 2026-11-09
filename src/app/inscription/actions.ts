"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerEmail } from "@/lib/email/client";
import { slugify } from "@/lib/utils";

export type EtatFormulaire = { error?: string } | null;

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/** Prévient les visiteurs qui avaient demandé une alerte pour ce métier/cette zone qu'un artisan vient de s'inscrire. */
async function notifierAlertesRecherche(
  metier: string | null,
  ville: string | null,
  codePostal: string | null,
  nomEntreprise: string,
  slug: string,
) {
  if (!metier) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data: alertes } = await admin
    .from("alertes_recherche")
    .select("id, email, ville")
    .eq("metier", metier)
    .is("notifie_le", null);
  if (!alertes || alertes.length === 0) return;

  const correspondantes = alertes.filter((a) => {
    if (!a.ville) return true;
    const terme = a.ville.toLowerCase();
    return Boolean(ville?.toLowerCase().includes(terme)) || Boolean(codePostal?.startsWith(terme));
  });
  if (correspondantes.length === 0) return;

  const base = await origine();
  for (const alerte of correspondantes) {
    const resultat = await envoyerEmail({
      to: alerte.email,
      subject: `Un ${metier} vient de s'inscrire près de chez vous`,
      text: `Bonjour,\n\nVous nous aviez demandé d'être prévenu(e) : ${nomEntreprise} vient de s'inscrire comme ${metier} dans votre secteur.\n\nDécouvrez son profil et réservez en ligne :\n${base}/e/${slug}\n\nCordialement,\nL'équipe ArtisanRDV`,
    });
    if (resultat.ok) {
      await admin.from("alertes_recherche").update({ notifie_le: new Date().toISOString() }).eq("id", alerte.id);
    }
  }
}

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

  try {
    await notifierAlertesRecherche(entreprise.metier, entreprise.ville, entreprise.code_postal, entreprise.nom, entreprise.slug);
  } catch {
    // Les alertes sont un bonus, pas de blocage de l'inscription si l'envoi échoue.
  }

  redirect("/dashboard");
}
