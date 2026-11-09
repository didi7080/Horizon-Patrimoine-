"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_JUSTIFICATIFS = "depenses-justificatifs";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

type Resultat = { ok: true } | { ok: false; erreur: string };

export async function creerDepense(formData: FormData): Promise<Resultat> {
  const { entreprise, userId, role } = await getEntrepriseContext();

  try {
    const categorie = String(formData.get("categorie") ?? "").trim();
    if (!categorie) throw new Error("La catégorie est requise.");
    const montantEuros = Number(formData.get("montant") ?? 0);
    if (!Number.isFinite(montantEuros) || montantEuros <= 0) throw new Error("Le montant doit être supérieur à 0.");
    const date = String(formData.get("date") ?? "").trim() || new Date().toISOString().slice(0, 10);

    const client = admin();

    let justificatifPath: string | null = null;
    const fichier = formData.get("justificatif");
    if (fichier instanceof File && fichier.size > 0) {
      if (fichier.size > 8 * 1024 * 1024) throw new Error("La photo est trop volumineuse (8 Mo maximum).");
      const extension = fichier.name.split(".").pop()?.toLowerCase() || "jpg";
      const chemin = `${entreprise.id}/${crypto.randomUUID()}.${extension}`;
      const { error: erreurUpload } = await client.storage
        .from(BUCKET_JUSTIFICATIFS)
        .upload(chemin, fichier, { contentType: fichier.type || undefined });
      if (erreurUpload) throw new Error("Impossible d'envoyer la photo : " + erreurUpload.message);
      justificatifPath = chemin;
    }

    // Un salarié soumet une dépense à faire valider ; le propriétaire/l'administrateur
    // l'enregistre directement comme avant (il n'a pas à se valider lui-même).
    const statut = role === "salarie" ? "en_attente" : "validee";

    const { error } = await client.from("depenses").insert({
      entreprise_id: entreprise.id,
      date,
      categorie,
      description: String(formData.get("description") ?? "").trim() || null,
      montant_cents: Math.round(montantEuros * 100),
      created_by: userId,
      justificatif_path: justificatifPath,
      statut,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/depenses");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function supprimerDepense(id: string): Promise<Resultat> {
  const { entreprise, userId, role } = await getEntrepriseContext();
  try {
    const base = admin().from("depenses").delete().eq("id", id).eq("entreprise_id", entreprise.id);
    // Un salarié ne peut retirer que ses propres notes de frais pas encore validées.
    const { error } =
      role === "salarie" ? await base.eq("created_by", userId).eq("statut", "en_attente") : await base;
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/depenses");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function validerDepense(id: string): Promise<Resultat> {
  const { entreprise, role } = await getEntrepriseContext();
  try {
    if (role === "salarie") throw new Error("Seul le gérant peut valider une dépense.");
    const { error } = await admin()
      .from("depenses")
      .update({ statut: "validee" })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/depenses");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function refuserDepense(id: string): Promise<Resultat> {
  const { entreprise, role } = await getEntrepriseContext();
  try {
    if (role === "salarie") throw new Error("Seul le gérant peut refuser une dépense.");
    const { error } = await admin()
      .from("depenses")
      .update({ statut: "refusee" })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/depenses");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function urlJustificatif(path: string): Promise<string | null> {
  const { data, error } = await admin().storage.from(BUCKET_JUSTIFICATIFS).createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}
