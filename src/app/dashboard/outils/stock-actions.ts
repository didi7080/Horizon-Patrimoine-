"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEntrepriseAvecOutils, type Resultat } from "@/app/dashboard/outils/actions";
import { notifierAlerteStock } from "@/lib/notifications/stock";

export async function prendrePieceCamion(
  materielId: string,
  salarieId: string,
  quantite: number,
  chantierId?: string | null,
): Promise<Resultat> {
  const contexte = await getEntrepriseAvecOutils();
  if (!contexte.ok) return contexte;
  try {
    if (!Number.isFinite(quantite) || quantite <= 0) throw new Error("La quantité doit être positive.");
    const supabase = await createClient();
    const { error } = await supabase.rpc("prendre_piece_camion", {
      p_materiel: materielId,
      p_salarie: salarieId,
      p_quantite: quantite,
      p_chantier: chantierId || null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/mon-camion");
    if (chantierId) revalidatePath(`/dashboard/chantiers/${chantierId}`);
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
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("reapprovisionner_camion", {
      p_materiel: materielId,
      p_salarie: salarieId,
      p_quantite: quantite,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/mon-camion");
    revalidatePath("/dashboard/outils/materiel");
    const resultat = data?.[0];
    if (resultat?.alerte_franchie) await notifierAlerteStock(materielId, resultat.nouvelle_quantite_depot);
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
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("ajuster_stock_depot", {
      p_materiel: materielId,
      p_quantite: quantite,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/outils/materiel");
    const resultat = data?.[0];
    if (resultat?.alerte_franchie) await notifierAlerteStock(materielId, resultat.nouvelle_quantite_depot);
    return { ok: true };
  } catch (err) {
    return { ok: false, erreur: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
