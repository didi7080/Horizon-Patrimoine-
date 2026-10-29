"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createAdminClient } from "@/lib/supabase/admin";

function admin() {
  const client = createAdminClient();
  if (!client) throw new Error("La connexion à la base de données n'est pas configurée.");
  return client;
}

export async function creerDepense(formData: FormData) {
  const { entreprise, userId } = await getEntrepriseContext();

  const categorie = String(formData.get("categorie") ?? "").trim();
  if (!categorie) throw new Error("La catégorie est requise.");
  const montantEuros = Number(formData.get("montant") ?? 0);
  if (!Number.isFinite(montantEuros) || montantEuros <= 0) throw new Error("Le montant doit être supérieur à 0.");
  const date = String(formData.get("date") ?? "").trim() || new Date().toISOString().slice(0, 10);

  const { error } = await admin().from("depenses").insert({
    entreprise_id: entreprise.id,
    date,
    categorie,
    description: String(formData.get("description") ?? "").trim() || null,
    montant_cents: Math.round(montantEuros * 100),
    created_by: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/depenses");
}

export async function supprimerDepense(id: string) {
  const { entreprise } = await getEntrepriseContext();
  const { error } = await admin().from("depenses").delete().eq("id", id).eq("entreprise_id", entreprise.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/depenses");
}
