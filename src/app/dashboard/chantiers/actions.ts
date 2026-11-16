"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntrepriseContext } from "@/lib/dashboard/context";

type Resultat = { ok: true } | { ok: false; erreur: string };
type ResultatId = { ok: true; id: string } | { ok: false; erreur: string };

export async function creerChantier(formData: FormData): Promise<ResultatId> {
  const { entreprise, userId } = await getEntrepriseContext();
  try {
    const supabase = await createClient();

    const clientId = String(formData.get("clientId") ?? "").trim();
    const titre = String(formData.get("titre") ?? "").trim();
    const adresse = String(formData.get("adresse") ?? "").trim();
    const dateDebut = String(formData.get("dateDebutPrevue") ?? "").trim();
    const dateFin = String(formData.get("dateFinPrevue") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!clientId) throw new Error("Le client est requis.");
    if (!titre) throw new Error("Le titre du chantier est requis.");

    const { data, error } = await supabase
      .from("chantiers")
      .insert({
        entreprise_id: entreprise.id,
        client_id: clientId,
        titre,
        adresse: adresse || null,
        date_debut_prevue: dateDebut || null,
        date_fin_prevue: dateFin || null,
        notes: notes || null,
        created_by: userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/chantiers");
    revalidatePath(`/dashboard/clients/${clientId}`);
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function mettreAJourChantier(id: string, formData: FormData): Promise<Resultat> {
  try {
    const supabase = await createClient();

    const titre = String(formData.get("titre") ?? "").trim();
    const adresse = String(formData.get("adresse") ?? "").trim();
    const dateDebut = String(formData.get("dateDebutPrevue") ?? "").trim();
    const dateFin = String(formData.get("dateFinPrevue") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    if (!titre) throw new Error("Le titre du chantier est requis.");

    const { data: chantier, error } = await supabase
      .from("chantiers")
      .update({
        titre,
        adresse: adresse || null,
        date_debut_prevue: dateDebut || null,
        date_fin_prevue: dateFin || null,
        notes: notes || null,
      })
      .eq("id", id)
      .select("client_id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/chantiers");
    revalidatePath(`/dashboard/chantiers/${id}`);
    revalidatePath(`/dashboard/clients/${chantier.client_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function changerStatutChantier(id: string, statut: "en_cours" | "termine" | "annule"): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { data: chantier, error } = await supabase
      .from("chantiers")
      .update({ statut })
      .eq("id", id)
      .select("client_id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/chantiers");
    revalidatePath(`/dashboard/chantiers/${id}`);
    revalidatePath(`/dashboard/clients/${chantier.client_id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function ajouterEtape(chantierId: string, titre: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    if (!titre.trim()) throw new Error("Le titre de l'étape est requis.");

    const { count } = await supabase
      .from("etapes_chantier")
      .select("id", { count: "exact", head: true })
      .eq("chantier_id", chantierId);

    const { error } = await supabase
      .from("etapes_chantier")
      .insert({ chantier_id: chantierId, titre: titre.trim(), ordre: count ?? 0 });
    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/chantiers/${chantierId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function basculerEtape(etapeId: string, chantierId: string, fait: boolean): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("etapes_chantier")
      .update({
        fait,
        fait_par: fait ? (user?.id ?? null) : null,
        fait_le: fait ? new Date().toISOString() : null,
      })
      .eq("id", etapeId);
    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/chantiers/${chantierId}`);
    revalidatePath("/dashboard/chantiers");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function supprimerEtape(etapeId: string, chantierId: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("etapes_chantier").delete().eq("id", etapeId);
    if (error) throw new Error(error.message);

    revalidatePath(`/dashboard/chantiers/${chantierId}`);
    revalidatePath("/dashboard/chantiers");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function lierChantierRdv(chantierId: string, rdvId: string): Promise<Resultat> {
  return lierRdvChantier(rdvId, chantierId);
}

export async function lierChantierDocument(chantierId: string, documentId: string): Promise<Resultat> {
  return lierDocumentChantier(documentId, chantierId);
}

export async function lierRdvChantier(rdvId: string, chantierId: string | null): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rendez_vous").update({ chantier_id: chantierId }).eq("id", rdvId);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rendez-vous");
    revalidatePath("/dashboard/ma-journee");
    if (chantierId) revalidatePath(`/dashboard/chantiers/${chantierId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function lierDocumentChantier(documentId: string, chantierId: string | null): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("documents").update({ chantier_id: chantierId }).eq("id", documentId);
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/documents");
    revalidatePath(`/dashboard/documents/${documentId}`);
    if (chantierId) revalidatePath(`/dashboard/chantiers/${chantierId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
