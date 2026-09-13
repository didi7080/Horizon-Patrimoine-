import { AuthShell } from "@/components/auth/auth-shell";
import { ConnexionForm } from "@/components/auth/connexion-form";

export default function ConnexionPage() {
  return (
    <AuthShell title="Content de vous revoir" description="Connectez-vous à votre espace artisan.">
      <ConnexionForm />
    </AuthShell>
  );
}
