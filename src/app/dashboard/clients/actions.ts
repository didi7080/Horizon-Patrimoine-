"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigure, envoyerEmail } from "@/lib/email/client";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

async function origine(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

/** Envoie une actualité (promotion, événement...) par e-mail aux clients de l'entreprise ayant une adresse enregistrée et non désabonnés, avec lien de désabonnement. */
export async function envoyerActualiteClients(
  sujet: string,
  message: string,
  filtreAdresse: string,
): Promise<{ nbEnvoyes: number; nbEchecs: number }> {
  const { entreprise } = await getEntrepriseContext();
  const supabase = admin();

  const sujetTrim = sujet.trim();
  const messageTrim = message.trim();
  if (!sujetTrim) throw new Error("L'objet est requis.");
  if (!messageTrim) throw new Error("Le message est requis.");
  if (!emailConfigure()) throw new Error("L'envoi d'e-mails n'est pas configuré sur cette instance.");

  let requete = supabase
    .from("clients")
    .select("email, token")
    .eq("entreprise_id", entreprise.id)
    .eq("desabonne_communications", false)
    .not("email", "is", null);
  if (filtreAdresse.trim()) requete = requete.ilike("adresse", `%${filtreAdresse.trim()}%`);

  const { data: clients, error } = await requete;
  if (error) throw new Error(error.message);
  if (!clients || clients.length === 0) {
    throw new Error("Aucun client correspondant n'a d'adresse e-mail enregistrée.");
  }

  const site = await origine();
  let nbEnvoyes = 0;
  let nbEchecs = 0;
  for (const client of clients) {
    if (!client.email) continue;
    const lienDesabonnement = `${site}/desabonnement/${client.token}`;
    const texte = `${messageTrim}\n\n—\n${entreprise.nom}\n\nVous recevez cet e-mail car vous êtes client(e) de ${entreprise.nom} sur ArtisanRDV. Pour ne plus recevoir ces actualités : ${lienDesabonnement}`;
    const resultat = await envoyerEmail({ to: client.email, subject: sujetTrim, text: texte });
    if (resultat.ok) nbEnvoyes++;
    else nbEchecs++;
  }

  return { nbEnvoyes, nbEchecs };
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
