import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminContext = { userId: string; email: string };

function emailsAdmin(): string[] {
  return (process.env.PLATEFORME_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Accès réservé aux propriétaires de la plateforme (pas les entreprises clientes).
 * Autorisé via une liste d'e-mails en variable d'environnement, plutôt qu'un rôle
 * en base : ce sont quelques personnes de confiance, pas un système de rôles à gérer.
 */
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) redirect("/connexion");

  const autorises = emailsAdmin();
  if (autorises.length === 0 || !autorises.includes(user.email.toLowerCase())) {
    redirect("/dashboard");
  }

  return { userId: user.id, email: user.email };
}
