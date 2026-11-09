"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ResultatAlerte = { ok: true } | { ok: false; erreur: string };

/** Enregistre une demande de visiteur n'ayant trouvé aucun artisan pour sa recherche, pour le prévenir dès qu'un artisan correspondant s'inscrit. */
export async function creerAlerteRecherche(metier: string, ville: string, email: string): Promise<ResultatAlerte> {
  try {
    const metierTrim = metier.trim();
    const emailTrim = email.trim();
    if (!metierTrim) throw new Error("Le métier est requis.");
    if (!emailTrim || !emailTrim.includes("@")) throw new Error("Adresse e-mail invalide.");

    const admin = createAdminClient();
    if (!admin) throw new Error("La connexion à la base de données n'est pas configurée.");

    const { error } = await admin.from("alertes_recherche").insert({
      metier: metierTrim,
      ville: ville.trim() || null,
      email: emailTrim,
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
