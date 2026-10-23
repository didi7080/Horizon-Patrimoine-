"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext, planActuelEntreprise } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { accesOutilsCalcul } from "@/lib/stripe";
import { modelesPourMetier } from "@/lib/calculs/modeles";
import { formuleValide } from "@/lib/calculs/evaluateur";
import type { Champ, DonneesEtude, Formule } from "@/lib/calculs/types";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

/** Comme getEntrepriseContext(), mais vérifie en plus l'accès à la formule Premium
 * (les pages sont déjà protégées par le layout, ceci couvre un appel direct de l'action). */
async function getEntrepriseAvecOutils() {
  const contexte = await getEntrepriseContext();
  const plan = await planActuelEntreprise(contexte.entreprise.id, contexte.entreprise.nb_salaries);
  if (!accesOutilsCalcul(plan)) {
    throw new Error("Les outils de calcul nécessitent la formule Premium.");
  }
  return contexte;
}

function parserChamps(json: string): Champ[] {
  const champs = JSON.parse(json) as Champ[];
  if (!Array.isArray(champs)) throw new Error("Liste de champs invalide.");
  for (const champ of champs) {
    if (!champ.id || !champ.label) throw new Error("Chaque champ doit avoir un identifiant et un libellé.");
  }
  return champs;
}

function parserFormules(json: string): Formule[] {
  const formules = JSON.parse(json) as Formule[];
  if (!Array.isArray(formules)) throw new Error("Liste de formules invalide.");
  for (const formule of formules) {
    if (!formule.id || !formule.label) throw new Error("Chaque formule doit avoir un identifiant et un libellé.");
    if (!formuleValide(formule.expression)) {
      throw new Error(`La formule "${formule.label}" contient une syntaxe non reconnue.`);
    }
  }
  return formules;
}

// --- Modules de calcul ----------------------------------------------------

export async function creerModuleDepuisModele(nomModele: string) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const modeles = modelesPourMetier(entreprise.metier);
  const modele = modeles.find((m) => m.nom === nomModele);
  if (!modele) throw new Error("Modèle introuvable.");

  const { error } = await admin().from("modules_calcul").insert({
    entreprise_id: entreprise.id,
    metier: entreprise.metier ?? "",
    nom: modele.nom,
    champs: modele.champs,
    formules: modele.formules,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/outils");
}

export async function enregistrerModule(formData: FormData) {
  const { entreprise } = await getEntrepriseAvecOutils();

  const id = String(formData.get("id") ?? "").trim() || null;
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) throw new Error("Le nom du module est requis.");
  const champs = parserChamps(String(formData.get("champs") ?? "[]"));
  const formules = parserFormules(String(formData.get("formules") ?? "[]"));

  const supabase = admin();
  let idFinal = id;
  if (id) {
    const { error } = await supabase
      .from("modules_calcul")
      .update({ nom, champs, formules, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("modules_calcul")
      .insert({
        entreprise_id: entreprise.id,
        metier: entreprise.metier ?? "",
        nom,
        champs,
        formules,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    idFinal = data.id;
  }
  revalidatePath("/dashboard/outils");
  revalidatePath(`/dashboard/outils/modules/${idFinal}`);
  return idFinal as string;
}

export async function supprimerModule(id: string) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin().from("modules_calcul").delete().eq("id", id).eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/outils");
}

// --- Études -----------------------------------------------------------

export async function enregistrerEtude(formData: FormData) {
  const { entreprise, userId } = await getEntrepriseAvecOutils();

  const id = String(formData.get("id") ?? "").trim() || null;
  const titre = String(formData.get("titre") ?? "").trim();
  if (!titre) throw new Error("Le titre de l'étude est requis.");
  const moduleId = String(formData.get("moduleId") ?? "").trim() || null;
  const clientNom = String(formData.get("clientNom") ?? "").trim() || null;
  const clientAdresse = String(formData.get("clientAdresse") ?? "").trim() || null;
  const clientTelephone = String(formData.get("clientTelephone") ?? "").trim() || null;
  const clientEmail = String(formData.get("clientEmail") ?? "").trim() || null;

  const supabase = admin();
  if (id) {
    const { error } = await supabase
      .from("etudes")
      .update({
        titre,
        module_id: moduleId,
        client_nom: clientNom,
        client_adresse: clientAdresse,
        client_telephone: clientTelephone,
        client_email: clientEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
    revalidatePath(`/dashboard/outils/etudes/${id}`);
  } else {
    const { data, error } = await supabase
      .from("etudes")
      .insert({
        entreprise_id: entreprise.id,
        metier: entreprise.metier ?? "",
        titre,
        module_id: moduleId,
        client_nom: clientNom,
        client_adresse: clientAdresse,
        client_telephone: clientTelephone,
        client_email: clientEmail,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/etudes");
    return data.id as string;
  }
  revalidatePath("/dashboard/outils/etudes");
}

export async function enregistrerDonneesEtude(etudeId: string, donnees: DonneesEtude) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin()
    .from("etudes")
    .update({ donnees, updated_at: new Date().toISOString() })
    .eq("id", etudeId)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/outils/etudes/${etudeId}`);
}

export async function changerStatutEtude(etudeId: string, statut: "brouillon" | "termine") {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin()
    .from("etudes")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", etudeId)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/outils/etudes/${etudeId}`);
  revalidatePath("/dashboard/outils/etudes");
}

export async function supprimerEtude(etudeId: string) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin().from("etudes").delete().eq("id", etudeId).eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/outils/etudes");
}

// --- Catalogue matériel -----------------------------------------------

export async function enregistrerMateriel(formData: FormData) {
  const { entreprise } = await getEntrepriseAvecOutils();

  const id = String(formData.get("id") ?? "").trim() || null;
  const designation = String(formData.get("designation") ?? "").trim();
  if (!designation) throw new Error("La désignation est requise.");
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const famille = String(formData.get("famille") ?? "").trim() || null;
  const unite = String(formData.get("unite") ?? "u").trim() || "u";
  const prixAchatEuros = formData.get("prixAchat");
  const prixAchatCents =
    prixAchatEuros === null || String(prixAchatEuros).trim() === ""
      ? null
      : Math.round(Number(prixAchatEuros) * 100);
  const coefficient = Number(formData.get("coefficient") ?? 1.4);

  const supabase = admin();
  if (id) {
    const { error } = await supabase
      .from("materiel_catalogue")
      .update({ designation, reference, famille, unite, prix_achat_cents: prixAchatCents, coefficient })
      .eq("id", id)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("materiel_catalogue").insert({
      entreprise_id: entreprise.id,
      designation,
      reference,
      famille,
      unite,
      prix_achat_cents: prixAchatCents,
      coefficient,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/dashboard/outils/materiel");
}

export async function togglerMaterielActif(id: string, actif: boolean) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin()
    .from("materiel_catalogue")
    .update({ actif })
    .eq("id", id)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/outils/materiel");
}

export async function supprimerMateriel(id: string) {
  const { entreprise } = await getEntrepriseAvecOutils();
  const { error } = await admin().from("materiel_catalogue").delete().eq("id", id).eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/outils/materiel");
}
