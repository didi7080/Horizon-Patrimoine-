"use server";

import { revalidatePath } from "next/cache";
import { getEntrepriseContext } from "@/lib/dashboard/context";
import { createClient } from "@/lib/supabase/server";
import { attacherDomaine, detacherDomaine, statutDomaine, vercelConfigure, type StatutDomaine } from "@/lib/vercel-domains";

const DOMAINE_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export async function connecterDomainePersonnalise(domaineBrut: string): Promise<void> {
  const { entreprise } = await getEntrepriseContext();
  if (!vercelConfigure()) throw new Error("Cette fonctionnalité n'est pas encore configurée sur cette instance.");

  const domaine = domaineBrut.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!DOMAINE_REGEX.test(domaine)) throw new Error("Nom de domaine invalide (ex. rdv.mon-site.fr).");

  const resultat = await attacherDomaine(domaine);
  if (!resultat.ok) throw new Error(resultat.erreur);

  const supabase = await createClient();
  const { error } = await supabase
    .from("entreprises")
    .update({ domaine_personnalise: domaine })
    .eq("id", entreprise.id);
  if (error) {
    if (error.code === "23505") throw new Error("Ce domaine est déjà utilisé par une autre entreprise.");
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/widget");
}

export async function verifierDomainePersonnalise(): Promise<StatutDomaine | null> {
  const { entreprise } = await getEntrepriseContext();
  if (!entreprise.domaine_personnalise) return null;
  return statutDomaine(entreprise.domaine_personnalise);
}

export async function deconnecterDomainePersonnalise(): Promise<void> {
  const { entreprise } = await getEntrepriseContext();
  if (entreprise.domaine_personnalise) await detacherDomaine(entreprise.domaine_personnalise);

  const supabase = await createClient();
  const { error } = await supabase
    .from("entreprises")
    .update({ domaine_personnalise: null })
    .eq("id", entreprise.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/widget");
}
