"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

/**
 * Supprime une fiche client si elle n'a aucun historique (créée par erreur,
 * jamais utilisée). Si des rendez-vous ou des devis/factures y sont liés, la
 * fiche n'est pas supprimée mais anonymisée : la loi impose de conserver les
 * documents commerciaux ~10 ans, mais les coordonnées personnelles du client
 * peuvent être effacées (droit RGPD à l'effacement) sans toucher à cet
 * historique, qui garde sa propre copie figée du nom/adresse à la date du
 * document.
 */
export async function supprimerOuAnonymiserClient(clientId: string): Promise<{ action: "supprime" | "anonymise" }> {
  const { entreprise } = await getEntrepriseContext();
  const supabase = admin();

  const [{ count: nbDocuments }, { count: nbRdv }] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("entreprise_id", entreprise.id),
    supabase
      .from("rendez_vous")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("entreprise_id", entreprise.id),
  ]);

  const aDeLHistorique = (nbDocuments ?? 0) > 0 || (nbRdv ?? 0) > 0;

  if (!aDeLHistorique) {
    const { error } = await supabase.from("clients").delete().eq("id", clientId).eq("entreprise_id", entreprise.id);
    if (error) throw new Error(error.message);
    revalidatePath("/dashboard/clients");
    return { action: "supprime" };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      nom: `Client anonymisé #${clientId.slice(0, 8)}`,
      email: null,
      telephone: null,
      adresse: null,
      notes: null,
    })
    .eq("id", clientId)
    .eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clients");
  return { action: "anonymise" };
}
