import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITE_PAR_DEFAUT = 8;
const FENETRE_MS_PAR_DEFAUT = 10 * 60 * 1000;

export async function adresseIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "inconnu";
}

/**
 * Limite partagée via la table Supabase `rate_limits` (RLS activée, aucune
 * policy : seule la clé service_role peut y lire/écrire) — fonctionne
 * correctement sur une infra serverless multi-instances, contrairement à un
 * store en mémoire.
 */
export async function limiteAtteinte(
  cle: string,
  options?: { limite?: number; fenetreMs?: number },
): Promise<boolean> {
  const limite = options?.limite ?? LIMITE_PAR_DEFAUT;
  const fenetreMs = options?.fenetreMs ?? FENETRE_MS_PAR_DEFAUT;

  const admin = createAdminClient();
  // Sans clé service_role, pas de protection possible : on laisse passer
  // plutôt que de bloquer les usages légitimes.
  if (!admin) return false;

  const fenetreDebut = new Date(Date.now() - fenetreMs).toISOString();
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

  return (count ?? 0) >= limite;
}
