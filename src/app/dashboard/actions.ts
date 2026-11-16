"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { synchroniserRdvEtParticipantsGoogle, synchroniserParticipantGoogle } from "@/lib/google-calendar/sync";

// --- Rendez-vous ---------------------------------------------------------

type Resultat = { ok: true } | { ok: false; erreur: string };

export async function validerDemande(rdvId: string, accepter: boolean): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("valider_demande_rdv", { p_rdv: rdvId, p_accepter: accepter });
    if (error) throw new Error(error.message);
    if (accepter) await synchroniserRdvEtParticipantsGoogle(rdvId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rendez-vous");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function changerStatutRdv(
  rdvId: string,
  statut: "annule" | "honore" | "absent" | "confirme",
): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("rendez_vous").update({ statut }).eq("id", rdvId);
    if (error) throw new Error(error.message);
    await synchroniserRdvEtParticipantsGoogle(rdvId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/rendez-vous");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function ajouterParticipantRdv(rdvId: string, salarieId: string): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
    const supabase = await createClient();
    const { data: rdv, error: erreurRdv } = await supabase
      .from("rendez_vous")
      .select("debut, fin")
      .eq("id", rdvId)
      .eq("entreprise_id", entreprise.id)
      .maybeSingle();
    if (erreurRdv) throw new Error(erreurRdv.message);
    if (!rdv) throw new Error("Rendez-vous introuvable.");

    const debut = new Date(rdv.debut).getTime();
    const fin = new Date(rdv.fin).getTime();
    const battementMs = entreprise.battement_min * 60_000;

    const [{ data: rdvsPrincipal }, { data: rdvsParticipant }, { data: absences }] = await Promise.all([
      supabase.from("rendez_vous").select("debut, fin").eq("salarie_id", salarieId).in("statut", ["confirme", "demande"]),
      supabase
        .from("rendez_vous_participants")
        .select("rendez_vous:rendez_vous_id(debut, fin, statut)")
        .eq("salarie_id", salarieId),
      supabase.from("absences").select("debut, fin").eq("salarie_id", salarieId),
    ]);

    const chevauche = (debutAutre: string, finAutre: string) =>
      new Date(debutAutre).getTime() - battementMs < fin && new Date(finAutre).getTime() + battementMs > debut;

    const conflitRdv = (rdvsPrincipal ?? []).some((r) => chevauche(r.debut, r.fin));
    const conflitParticipation = (rdvsParticipant ?? []).some((p) => {
      const autre = p.rendez_vous as unknown as { debut: string; fin: string; statut: string } | null;
      return autre && ["confirme", "demande"].includes(autre.statut) && chevauche(autre.debut, autre.fin);
    });
    const conflitAbsence = (absences ?? []).some((a) => new Date(a.debut).getTime() < fin && new Date(a.fin).getTime() > debut);

    if (conflitRdv || conflitParticipation) throw new Error("Ce collègue a déjà un rendez-vous sur ce créneau.");
    if (conflitAbsence) throw new Error("Ce collègue est marqué absent sur ce créneau.");

    const { error } = await supabase.from("rendez_vous_participants").insert({ rendez_vous_id: rdvId, salarie_id: salarieId });
    if (error) throw new Error(error.message);

    await synchroniserParticipantGoogle(rdvId, salarieId);
    revalidatePath("/dashboard/rendez-vous");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function retirerParticipantRdv(rdvId: string, salarieId: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("rendez_vous_participants")
      .delete()
      .eq("rendez_vous_id", rdvId)
      .eq("salarie_id", salarieId);
    if (error) throw new Error(error.message);

    await synchroniserParticipantGoogle(rdvId, salarieId, true);
    revalidatePath("/dashboard/rendez-vous");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Photos d'intervention ---------------------------------------------------

const BUCKET_PHOTOS = "photos-interventions";

export async function ajouterPhotoIntervention(
  rdvId: string,
  type: "avant" | "apres",
  formData: FormData,
): Promise<Resultat> {
  const { entreprise, userId } = await getEntrepriseContext();
  try {
    const fichier = formData.get("photo");
    if (!(fichier instanceof File) || fichier.size === 0) throw new Error("Aucune photo fournie.");
    if (fichier.size > 8 * 1024 * 1024) throw new Error("La photo est trop volumineuse (8 Mo maximum).");

    const admin = createAdminClient();
    if (!admin) throw new Error("La connexion à la base de données n'est pas configurée.");

    const { data: rdv } = await admin.from("rendez_vous").select("id").eq("id", rdvId).eq("entreprise_id", entreprise.id).maybeSingle();
    if (!rdv) throw new Error("Rendez-vous introuvable.");

    const extension = fichier.name.split(".").pop()?.toLowerCase() || "jpg";
    const chemin = `${entreprise.id}/${rdvId}/${crypto.randomUUID()}.${extension}`;
    const { error: erreurUpload } = await admin.storage
      .from(BUCKET_PHOTOS)
      .upload(chemin, fichier, { contentType: fichier.type || undefined });
    if (erreurUpload) throw new Error("Impossible d'envoyer la photo : " + erreurUpload.message);

    const { error } = await admin.from("photos_intervention").insert({
      entreprise_id: entreprise.id,
      rendez_vous_id: rdvId,
      type,
      chemin_stockage: chemin,
      created_by: userId,
    });
    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/rendez-vous");
    revalidatePath("/dashboard/ma-journee");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function supprimerPhotoIntervention(photoId: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { data: photo, error: erreurLecture } = await supabase
      .from("photos_intervention")
      .select("chemin_stockage")
      .eq("id", photoId)
      .maybeSingle();
    if (erreurLecture) throw new Error(erreurLecture.message);
    if (!photo) throw new Error("Photo introuvable.");

    const { error } = await supabase.from("photos_intervention").delete().eq("id", photoId);
    if (error) throw new Error(error.message);

    const admin = createAdminClient();
    if (admin) await admin.storage.from(BUCKET_PHOTOS).remove([photo.chemin_stockage]);

    revalidatePath("/dashboard/rendez-vous");
    revalidatePath("/dashboard/ma-journee");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function urlPhotoIntervention(chemin: string): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.storage.from(BUCKET_PHOTOS).createSignedUrl(chemin, 300);
  if (error) return null;
  return data.signedUrl;
}

export type PhotoAffichee = { id: string; type: "avant" | "apres"; url: string };

export async function listerPhotosIntervention(rdvId: string): Promise<PhotoAffichee[]> {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("photos_intervention")
    .select("id, type, chemin_stockage")
    .eq("rendez_vous_id", rdvId)
    .order("created_at");
  if (!photos || photos.length === 0) return [];

  const admin = createAdminClient();
  if (!admin) return [];

  const resultats = await Promise.all(
    photos.map(async (p) => {
      const { data } = await admin.storage.from(BUCKET_PHOTOS).createSignedUrl(p.chemin_stockage, 300);
      return data?.signedUrl ? { id: p.id, type: p.type as "avant" | "apres", url: data.signedUrl } : null;
    }),
  );
  return resultats.filter((p): p is PhotoAffichee => p !== null);
}

// --- Google Calendar -------------------------------------------------------

export async function deconnecterGoogleCalendar(salarieId: string): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
    const admin = createAdminClient();
    if (!admin) throw new Error("La connexion à la base de données n'est pas configurée.");
    const { error } = await admin
      .from("salaries")
      .update({ google_refresh_token: null, google_email: null })
      .eq("id", salarieId)
      .eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Prestations ----------------------------------------------------------

export async function enregistrerPrestation(formData: FormData): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
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
    const acompteEuros = formData.get("acompte");
    const acompteCents =
      acompteEuros === null || String(acompteEuros).trim() === ""
        ? null
        : Math.round(Number(acompteEuros) * 100);
    const salarieIds = formData.getAll("salarieIds").map(String);
    const urgenceActive = formData.get("urgenceActive") === "on";

    if (!nom) throw new Error("Le nom de la prestation est requis.");
    if (acompteCents !== null && prixCents !== null && acompteCents > prixCents) {
      throw new Error("L'acompte ne peut pas dépasser le prix de la prestation.");
    }

    let prestationId = id;
    if (id) {
      const { error } = await supabase
        .from("prestations")
        .update({
          nom,
          description: description || null,
          duree_min: dureeMin,
          prix_cents: prixCents,
          acompte_cents: acompteCents,
          urgence_active: urgenceActive,
        })
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
          acompte_cents: acompteCents,
          urgence_active: urgenceActive,
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
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function togglePrestationActif(id: string, actif: boolean): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("prestations").update({ actif }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/prestations");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Équipe -----------------------------------------------------------

export async function enregistrerSalarie(formData: FormData): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
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
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function toggleSalarieActif(id: string, actif: boolean): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("salaries").update({ actif }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function ajouterHoraire(salarieId: string, jour: number, debut: string, fin: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("horaires").insert({ salarie_id: salarieId, jour, debut, fin });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function supprimerHoraire(id: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("horaires").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/equipe");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Clients ------------------------------------------------------------

export async function enregistrerNotesClient(id: string, notes: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("clients").update({ notes }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/clients");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Avis -----------------------------------------------------------------

export async function togglePublieAvis(id: string, publie: boolean): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("avis").update({ publie }).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/avis");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function repondreAvis(id: string, reponse: string): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
    const supabase = await createClient();
    const texte = reponse.trim();
    const { error } = await supabase
      .from("avis")
      .update({ reponse_artisan: texte || null, reponse_le: texte ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/avis");
    revalidatePath(`/e/${entreprise.slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Réglages ---------------------------------------------------------

export async function mettreAJourReglages(formData: FormData): Promise<Resultat> {
  const { entreprise } = await getEntrepriseContext();
  try {
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
        recap_rdv_actif: formData.get("recapRdvActif") === "on",
        recap_devis_actif: formData.get("recapDevisActif") === "on",
        recap_factures_actif: formData.get("recapFacturesActif") === "on",
        recap_avis_actif: formData.get("recapAvisActif") === "on",
        recap_depenses_actif: formData.get("recapDepensesActif") === "on",
        siret: String(formData.get("siret") ?? "").trim() || null,
        forme_juridique: String(formData.get("formeJuridique") ?? "").trim() || null,
        assujetti_tva: formData.get("assujettiTva") === "on",
        numero_tva: String(formData.get("numeroTva") ?? "").trim() || null,
        assurance_nom: String(formData.get("assuranceNom") ?? "").trim() || null,
        assurance_zone: String(formData.get("assuranceZone") ?? "").trim() || null,
        mentions_legales: String(formData.get("mentionsLegales") ?? "").trim() || null,
      })
      .eq("id", entreprise.id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/reglages");
    revalidatePath(`/e/${entreprise.slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

// --- Notifications push (par appareil) -----------------------------------

export type AbonnementPush = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function enregistrerAbonnementPush(abonnement: AbonnementPush): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié.");

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        profile_id: user.id,
        endpoint: abonnement.endpoint,
        p256dh: abonnement.keys.p256dh,
        cle_auth: abonnement.keys.auth,
      },
      { onConflict: "profile_id,endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function supprimerAbonnementPush(endpoint: string): Promise<Resultat> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
