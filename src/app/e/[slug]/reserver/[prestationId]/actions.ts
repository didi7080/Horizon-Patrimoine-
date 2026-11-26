"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estBot } from "@/lib/anti-spam";
import { verifierTurnstile } from "@/lib/turnstile";
import { synchroniserRdvGoogle } from "@/lib/google-calendar/sync";
import { notifierNouveauRdv, notifierConfirmationClient } from "@/lib/notifications/rdv";
import { adresseIp, limiteAtteinte } from "@/lib/rate-limit";

export type EtatReservation = { error?: string; token?: string } | null;

export async function reserverRdvAction(
  _etat: EtatReservation,
  formData: FormData,
): Promise<EtatReservation> {
  if (estBot(formData)) {
    return { error: "Une erreur est survenue. Merci de réessayer." };
  }

  const ip = await adresseIp();
  if (!(await verifierTurnstile(String(formData.get("cf_turnstile_token") ?? ""), ip))) {
    return { error: "Vérification anti-robot échouée, merci de réessayer." };
  }
  if (await limiteAtteinte(`rdv:${ip}`)) {
    return { error: "Trop de tentatives depuis votre connexion. Réessayez dans quelques minutes." };
  }

  const nom = String(formData.get("nom") ?? "").trim();
  const tel = String(formData.get("tel") ?? "").trim();
  const entrepriseId = String(formData.get("entreprise_id") ?? "");
  const prestationId = String(formData.get("prestation_id") ?? "");
  const salarieId = String(formData.get("salarie_id") ?? "");
  const debut = String(formData.get("debut") ?? "");

  if (!nom || !tel || !entrepriseId || !prestationId || !salarieId || !debut) {
    return { error: "Merci de compléter tous les champs obligatoires." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reserver_rdv", {
    p_entreprise: entrepriseId,
    p_prestation: prestationId,
    p_salarie: salarieId,
    p_debut: debut,
    p_nom: nom,
    p_email: String(formData.get("email") ?? "").trim(),
    p_tel: tel,
    p_notes: String(formData.get("notes") ?? "").trim(),
    p_adresse: String(formData.get("adresse") ?? "").trim() || undefined,
    p_code_postal: String(formData.get("code_postal") ?? "").trim() || undefined,
  });

  if (error) return { error: error.message };

  const admin = createAdminClient();
  if (admin) {
    const { data: rdv } = await admin.from("rendez_vous").select("id").eq("token", data as string).maybeSingle();
    if (rdv) {
      await synchroniserRdvGoogle(rdv.id);
      await notifierNouveauRdv(rdv.id);
      await notifierConfirmationClient(rdv.id);
    }
  }

  return { token: data as string };
}

export type EtatListeAttente = { error?: string; success?: boolean } | null;

export async function rejoindreListeAttenteAction(
  _etat: EtatListeAttente,
  formData: FormData,
): Promise<EtatListeAttente> {
  if (estBot(formData)) {
    return { error: "Une erreur est survenue. Merci de réessayer." };
  }

  const ip = await adresseIp();
  if (!(await verifierTurnstile(String(formData.get("cf_turnstile_token") ?? ""), ip))) {
    return { error: "Vérification anti-robot échouée, merci de réessayer." };
  }
  if (await limiteAtteinte(`attente:${ip}`)) {
    return { error: "Trop de tentatives. Réessayez plus tard." };
  }

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { error: "Merci de renseigner votre nom." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("rejoindre_liste_attente", {
    p_entreprise: String(formData.get("entreprise_id") ?? ""),
    p_prestation: (String(formData.get("prestation_id") ?? "") || null) as string,
    p_salarie: null as unknown as string,
    p_nom: nom,
    p_email: String(formData.get("email") ?? "").trim(),
    p_tel: String(formData.get("tel") ?? "").trim(),
  });

  if (error) return { error: error.message };
  return { success: true };
}
