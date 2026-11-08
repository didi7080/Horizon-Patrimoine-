"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LigneDocument, TypeDocument } from "@/lib/documents/types";
import { resoudreOuCreerClient } from "@/lib/clients/resoudre";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

function admin(): AdminClient {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

function parserLignes(json: string): LigneDocument[] {
  const lignes = JSON.parse(json) as LigneDocument[];
  if (!Array.isArray(lignes)) throw new Error("Liste de lignes invalide.");
  for (const ligne of lignes) {
    if (!ligne.id || !ligne.designation) throw new Error("Chaque ligne doit avoir une désignation.");
  }
  return lignes;
}

/** Numéro séquentiel, continu et sans trou par entreprise/type/année (ex. F-2026-0001). */
async function prochainNumero(supabase: AdminClient, entrepriseId: string, type: TypeDocument): Promise<string> {
  const annee = new Date().getFullYear();
  const { data: compteur } = await supabase
    .from("compteurs_documents")
    .select("dernier_numero")
    .eq("entreprise_id", entrepriseId)
    .eq("type", type)
    .eq("annee", annee)
    .maybeSingle();
  const prochain = (compteur?.dernier_numero ?? 0) + 1;
  const { error } = await supabase
    .from("compteurs_documents")
    .upsert(
      { entreprise_id: entrepriseId, type, annee, dernier_numero: prochain },
      { onConflict: "entreprise_id,type,annee" },
    );
  if (error) throw new Error(error.message);
  const prefixe = type === "devis" ? "D" : "F";
  return `${prefixe}-${annee}-${String(prochain).padStart(4, "0")}`;
}

export async function creerDocument(type: TypeDocument, formData: FormData): Promise<string> {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = admin();

  const clientIdChoisi = String(formData.get("clientId") ?? "").trim() || null;
  let clientId = clientIdChoisi;
  let clientNom: string;
  let clientAdresse: string | null;
  let clientTelephone: string | null;
  let clientEmail: string | null;

  if (clientIdChoisi) {
    const { data: client, error } = await supabase
      .from("clients")
      .select("nom, adresse, telephone, email")
      .eq("id", clientIdChoisi)
      .eq("entreprise_id", entreprise.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!client) throw new Error("Client introuvable.");
    clientNom = client.nom;
    clientAdresse = client.adresse;
    clientTelephone = client.telephone;
    clientEmail = client.email;
  } else {
    clientNom = String(formData.get("clientNom") ?? "").trim();
    if (!clientNom) throw new Error("Le nom du client est requis.");
    clientAdresse = String(formData.get("clientAdresse") ?? "").trim() || null;
    clientTelephone = String(formData.get("clientTelephone") ?? "").trim() || null;
    clientEmail = String(formData.get("clientEmail") ?? "").trim() || null;

    // Enregistre automatiquement ce nouveau client dans le fichier clients, pour le retrouver la prochaine fois.
    const { data: nouveauClient, error: erreurClient } = await supabase
      .from("clients")
      .insert({ entreprise_id: entreprise.id, nom: clientNom, adresse: clientAdresse, telephone: clientTelephone, email: clientEmail })
      .select("id")
      .single();
    if (erreurClient) throw new Error(erreurClient.message);
    clientId = nouveauClient.id;
  }

  const numero = await prochainNumero(supabase, entreprise.id, type);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      entreprise_id: entreprise.id,
      type,
      numero,
      client_id: clientId,
      client_nom: clientNom,
      client_adresse: clientAdresse,
      client_telephone: clientTelephone,
      client_email: clientEmail,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard/clients");
  return data.id as string;
}

export type DonneesDocument = {
  clientNom: string;
  clientAdresse: string;
  clientTelephone: string;
  clientEmail: string;
  dateValidite: string;
  dateEcheance: string;
  datePrestation: string;
  notes: string;
};

export async function enregistrerLignesDocument(documentId: string, lignesJson: string, donnees: DonneesDocument) {
  const { entreprise } = await getEntrepriseContext();
  const supabase = admin();
  const lignes = parserLignes(lignesJson);
  const clientNom = donnees.clientNom.trim();
  if (!clientNom) throw new Error("Le nom du client est requis.");
  const clientAdresse = donnees.clientAdresse.trim() || null;
  const clientTelephone = donnees.clientTelephone.trim() || null;
  const clientEmail = donnees.clientEmail.trim() || null;

  const { data: actuel, error: erreurActuel } = await supabase
    .from("documents")
    .select("client_id, client_nom, client_adresse, client_telephone, client_email")
    .eq("id", documentId)
    .eq("entreprise_id", entreprise.id)
    .single();
  if (erreurActuel) throw new Error(erreurActuel.message);

  // On ne retrouve/crée la fiche client que si ses informations ont vraiment
  // changé (ex. après une duplication de devis pour un autre client) : si rien
  // n'a changé, on garde le client_id existant, même si son nom n'est plus
  // unique en base, pour ne jamais décrocher un document d'un client déjà
  // correctement lié.
  const infosInchangees =
    actuel.client_nom === clientNom &&
    actuel.client_adresse === clientAdresse &&
    actuel.client_telephone === clientTelephone &&
    actuel.client_email === clientEmail;
  const clientId = infosInchangees
    ? actuel.client_id
    : await resoudreOuCreerClient(supabase, entreprise.id, {
        nom: clientNom,
        adresse: clientAdresse,
        telephone: clientTelephone,
        email: clientEmail,
      });

  const { error } = await supabase
    .from("documents")
    .update({
      lignes,
      client_id: clientId,
      client_nom: clientNom,
      client_adresse: clientAdresse,
      client_telephone: clientTelephone,
      client_email: clientEmail,
      date_validite: donnees.dateValidite || null,
      date_echeance: donnees.dateEcheance || null,
      date_prestation: donnees.datePrestation || null,
      notes: donnees.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/documents/${documentId}`);
  revalidatePath("/dashboard/clients");
}

const STATUTS_VALIDES = new Set(["brouillon", "envoye", "accepte", "refuse", "envoyee", "payee"]);

export async function changerStatutDocument(documentId: string, statut: string) {
  if (!STATUTS_VALIDES.has(statut)) throw new Error("Statut invalide.");
  const { entreprise } = await getEntrepriseContext();
  const { error } = await admin()
    .from("documents")
    .update({ statut, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/documents/${documentId}`);
  revalidatePath("/dashboard/documents");
}

/** Crée une facture reprenant les lignes d'un devis accepté, et conserve le lien vers celui-ci. */
export async function convertirDevisEnFacture(devisId: string): Promise<string> {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = admin();

  const { data: devis, error: erreurDevis } = await supabase
    .from("documents")
    .select("*")
    .eq("id", devisId)
    .eq("entreprise_id", entreprise.id)
    .eq("type", "devis")
    .maybeSingle();
  if (erreurDevis) throw new Error(erreurDevis.message);
  if (!devis) throw new Error("Devis introuvable.");

  const numero = await prochainNumero(supabase, entreprise.id, "facture");
  const { data: facture, error } = await supabase
    .from("documents")
    .insert({
      entreprise_id: entreprise.id,
      type: "facture",
      numero,
      client_id: devis.client_id,
      client_nom: devis.client_nom,
      client_adresse: devis.client_adresse,
      client_telephone: devis.client_telephone,
      client_email: devis.client_email,
      lignes: devis.lignes,
      date_prestation: devis.date_prestation,
      notes: devis.notes,
      devis_origine_id: devis.id,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (devis.statut !== "accepte") {
    await supabase.from("documents").update({ statut: "accepte" }).eq("id", devis.id);
  }

  revalidatePath("/dashboard/documents");
  return facture.id as string;
}

/** Copie un devis ou une facture existant·e (client, lignes, notes) en un nouveau
 * document brouillon avec son propre numéro, pour refaire rapidement un travail
 * similaire sans tout ressaisir. */
export async function dupliquerDocument(documentId: string): Promise<string> {
  const { entreprise, userId } = await getEntrepriseContext();
  const supabase = admin();

  const { data: source, error: erreurSource } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("entreprise_id", entreprise.id)
    .maybeSingle();
  if (erreurSource) throw new Error(erreurSource.message);
  if (!source) throw new Error("Document introuvable.");

  const numero = await prochainNumero(supabase, entreprise.id, source.type as TypeDocument);
  const { data: copie, error } = await supabase
    .from("documents")
    .insert({
      entreprise_id: entreprise.id,
      type: source.type,
      numero,
      client_id: source.client_id,
      client_nom: source.client_nom,
      client_adresse: source.client_adresse,
      client_telephone: source.client_telephone,
      client_email: source.client_email,
      lignes: source.lignes,
      date_prestation: source.date_prestation,
      notes: source.notes,
      created_by: userId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/documents");
  return copie.id as string;
}

export async function supprimerDocument(documentId: string) {
  const { entreprise } = await getEntrepriseContext();
  const { error } = await admin().from("documents").delete().eq("id", documentId).eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}
