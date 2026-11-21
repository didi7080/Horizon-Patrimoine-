import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ReinitialiserMotDePasseForm } from "@/components/auth/reinitialiser-mot-de-passe-form";
import { createClient } from "@/lib/supabase/server";

export default async function ReinitialiserMotDePassePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mot-de-passe-oublie?erreur=lien_invalide");

  return (
    <AuthShell title="Nouveau mot de passe" description="Choisissez un nouveau mot de passe pour votre compte.">
      <ReinitialiserMotDePasseForm />
    </AuthShell>
  );
}
