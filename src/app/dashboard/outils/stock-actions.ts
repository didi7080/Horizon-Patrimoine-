"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEntrepriseAvecOutils, type Resultat } from "@/app/dashboard/outils/actions";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

export async function prendrePieceCamion(materielId: string, salarieId: string, quantite: number): Promise<Resultat> {
  const contexte = await getEntrepriseAvecOutils();
  if (!contexte.ok) return contexte;
  try {
    if (!Number.isFinite(quantite) || quantite <= 0) throw new Error("La quantité doit être positive.");
    const { error } = await admin().rpc("prendre_piece_camion", {
      p_materiel: materielId,
      p_salarie: salarieId,
      p_quantite: quantite,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/mon-camion");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function reapprovisionnerCamion(materielId: string, salarieId: string, quantite: number): Promise<Resultat> {
  const contexte = await getEntrepriseAvecOutils();
  if (!contexte.ok) return contexte;
  try {
    if (!Number.isFinite(quantite) || quantite <= 0) throw new Error("La quantité doit être positive.");
    const { error } = await admin().rpc("reapprovisionner_camion", {
      p_materiel: materielId,
      p_salarie: salarieId,
      p_quantite: quantite,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/mon-camion");
    revalidatePath("/dashboard/outils/materiel");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}

export async function ajusterStockDepot(materielId: string, quantite: number): Promise<Resultat> {
  const contexte = await getEntrepriseAvecOutils();
  if (!contexte.ok) return contexte;
  try {
    if (!Number.isFinite(quantite) || quantite === 0) throw new Error("La quantité ne peut pas être nulle.");
    const { error } = await admin().rpc("ajuster_stock_depot", {
      p_materiel: materielId,
      p_quantite: quantite,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/materiel");
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
