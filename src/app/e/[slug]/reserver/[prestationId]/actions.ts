"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Rate limiting in-memory : suffisant pour dissuader le spam basique sur une
// instance unique. Pour une charge importante multi-instance, remplacer par
// un store partagé (ex. Upstash Redis).
const tentatives = new Map<string, number[]>();
const LIMITE_TENTATIVES = 8;
const FENETRE_MS = 10 * 60 * 1000;

function limiteAtteinte(cle: string): boolean {
  const maintenant = Date.now();
  const historique = (tentatives.get(cle) ?? []).filter((t) => maintenant - t < FENETRE_MS);
  historique.push(maintenant);
  tentatives.set(cle, historique);
  return historique.length > LIMITE_TENTATIVES;
}

async function adresseIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "inconnu";
}

function estBot(formData: FormData): boolean {
  const piege = String(formData.get("site_web") ?? "").trim();
  if (piege !== "") return true;
  const renduA = Number(formData.get("rendu_a") ?? 0);
  if (!renduA || Date.now() - renduA < 1200) return true;
  return false;
}

export type EtatReservation = { error?: string; token?: string } | null;

export async function reserverRdvAction(
  _etat: EtatReservation,
  formData: FormData,
): Promise<EtatReservation> {
  if (estBot(formData)) {
    return { error: "Une erreur est survenue. Merci de réessayer." };
  }

  const ip = await adresseIp();
  if (limiteAtteinte(`rdv:${ip}`)) {
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
  if (limiteAtteinte(`attente:${ip}`)) {
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
