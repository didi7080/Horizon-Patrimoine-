import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Retrouve un client existant (par e-mail exact, sinon par nom exact unique) ou
 * en crée un nouveau. Utilisé partout où un nom de client est saisi librement
 * (devis/facture, duplication, assistant IA) pour que le client_id reste
 * toujours cohérent avec le nom affiché, sans jamais dupliquer une fiche déjà
 * enregistrée sous le même nom/e-mail.
 */
export async function resoudreOuCreerClient(
  admin: AdminClient,
  entrepriseId: string,
  donnees: { nom: string; email?: string | null; telephone?: string | null; adresse?: string | null },
): Promise<string> {
  const email = donnees.email?.trim();
  if (email) {
    const { data } = await admin
      .from("clients")
      .select("id")
      .eq("entreprise_id", entrepriseId)
      .ilike("email", email)
      .maybeSingle();
    if (data) return data.id;
  }

  const nom = donnees.nom.trim();
  const { data: parNom } = await admin
    .from("clients")
    .select("id")
    .eq("entreprise_id", entrepriseId)
    .ilike("nom", nom)
    .limit(2);
  if (parNom && parNom.length === 1) return parNom[0].id;

  const { data: nouveau, error } = await admin
    .from("clients")
    .insert({
      entreprise_id: entrepriseId,
      nom,
      adresse: donnees.adresse?.trim() || null,
      telephone: donnees.telephone?.trim() || null,
      email: email || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return nouveau.id;
}
