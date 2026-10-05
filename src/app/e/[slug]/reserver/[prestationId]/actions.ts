"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estBot } from "@/lib/anti-spam";

// Rate limiting partagé via la table Supabase `rate_limits` (RLS activée,
// aucune policy : seule la clé service_role peut y lire/écrire). Remplace
// l'ancien store en mémoire, qui ne protégeait rien sur une infra
// serverless multi-instances (chaque instance avait son propre Map).
const LIMITE_TENTATIVES = 8;
const FENETRE_MS = 10 * 60 * 1000;

async function limiteAtteinte(cle: string): Promise<boolean> {
  const admin = createAdminClient();
  // Sans clé service_role, pas de protection possible : on laisse passer
  // plutôt que de bloquer les réservations légitimes.
  if (!admin) return false;

  const fenetreDebut = new Date(Date.now() - FENETRE_MS).toISOString();
  const { count } = await admin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("cle", cle)
    .gte("cree_le", fenetreDebut);

  await admin.from("rate_limits").insert({ cle });

  // Purge opportuniste des anciennes entrées (évite une tâche planifiée dédiée).
  if (Math.random() < 0.01) {
    const hier = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin.from("rate_limits").delete().lt("cree_le", hier);
  }

  return (count ?? 0) >= LIMITE_TENTATIVES;
}

async function adresseIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "inconnu";
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
