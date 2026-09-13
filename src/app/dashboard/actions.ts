"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntrepriseContext } from "@/lib/dashboard/context";

// --- Rendez-vous ---------------------------------------------------------

export async function validerDemande(rdvId: string, accepter: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("valider_demande_rdv", { p_rdv: rdvId, p_accepter: accepter });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rendez-vous");
}

export async function changerStatutRdv(
  rdvId: string,
  statut: "annule" | "honore" | "absent" | "confirme",
) {
  const supabase = await createClient();
  const { error } = await supabase.from("rendez_vous").update({ statut }).eq("id", rdvId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rendez-vous");
}

// --- Prestations ----------------------------------------------------------

export async function enregistrerPrestation(formData: FormData) {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim() || null;
  const nom = String(formData.get("nom") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dureeMin = Number(formData.get("dureeMin") ?? 60);
  const prixEuros = formData.get("prix");
  const prixCents =
    prixEuros === null || String(prixEuros).trim() === ""
      ? null
      : Math.round(Number(prixEuros) * 100);
  const salarieIds = formData.getAll("salarieIds").map(String);

  if (!nom) throw new Error("Le nom de la prestation est requis.");

  let prestationId = id;
  if (id) {
    const { error } = await supabase
      .from("prestations")
      .update({ nom, description: description || null, duree_min: dureeMin, prix_cents: prixCents })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("prestations")
      .insert({
        entreprise_id: entreprise.id,
        nom,
        description: description || null,
        duree_min: dureeMin,
        prix_cents: prixCents,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    prestationId = data.id;
  }

  await supabase.from("prestation_salaries").delete().eq("prestation_id", prestationId!);
  if (salarieIds.length > 0) {
    await supabase
      .from("prestation_salaries")
      .insert(salarieIds.map((salarie_id) => ({ prestation_id: prestationId!, salarie_id })));
  }

  revalidatePath("/dashboard/prestations");
}

export async function togglePrestationActif(id: string, actif: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("prestations").update({ actif }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/prestations");
}

// --- Équipe -----------------------------------------------------------

export async function enregistrerSalarie(formData: FormData) {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim() || null;
  const nom = String(formData.get("nom") ?? "").trim();
  const fonction = String(formData.get("fonction") ?? "").trim();
  const couleur = String(formData.get("couleur") ?? "#2563eb");

  if (!nom) throw new Error("Le nom est requis.");

  if (id) {
    const { error } = await supabase
      .from("salaries")
      .update({ nom, fonction: fonction || null, couleur })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("salaries")
      .insert({ entreprise_id: entreprise.id, nom, fonction: fonction || null, couleur });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/equipe");
}

export async function toggleSalarieActif(id: string, actif: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("salaries").update({ actif }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/equipe");
}

export async function ajouterHoraire(salarieId: string, jour: number, debut: string, fin: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("horaires").insert({ salarie_id: salarieId, jour, debut, fin });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/equipe");
}

export async function supprimerHoraire(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("horaires").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/equipe");
}

// --- Clients ------------------------------------------------------------

export async function enregistrerNotesClient(id: string, notes: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ notes }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clients");
}

// --- Avis -----------------------------------------------------------------

export async function togglePublieAvis(id: string, publie: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("avis").update({ publie }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/avis");
}

// --- Réglages ---------------------------------------------------------

export async function mettreAJourReglages(formData: FormData) {
  const { entreprise } = await getEntrepriseContext();
  const supabase = await createClient();

  const zoneCodes = String(formData.get("zoneCodes") ?? "")
    .split(",")
    .map((z) => z.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("entreprises")
    .update({
      nom: String(formData.get("nom") ?? entreprise.nom),
      description: String(formData.get("description") ?? "").trim() || null,
      telephone: String(formData.get("telephone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      adresse: String(formData.get("adresse") ?? "").trim() || null,
      ville: String(formData.get("ville") ?? "").trim() || null,
      code_postal: String(formData.get("codePostal") ?? "").trim() || null,
      couleur: String(formData.get("couleur") ?? entreprise.couleur),
      delai_min_heures: Number(formData.get("delaiMinHeures") ?? entreprise.delai_min_heures),
      fenetre_max_jours: Number(formData.get("fenetreMaxJours") ?? entreprise.fenetre_max_jours),
      battement_min: Number(formData.get("battementMin") ?? entreprise.battement_min),
      zone_codes: zoneCodes,
      validation_manuelle: formData.get("validationManuelle") === "on",
      avis_actif: formData.get("avisActif") === "on",
      sms_actif: formData.get("smsActif") === "on",
      recap_actif: formData.get("recapActif") === "on",
    })
    .eq("id", entreprise.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reglages");
  revalidatePath(`/e/${entreprise.slug}`);
}
