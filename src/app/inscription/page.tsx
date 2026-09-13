import { AuthShell } from "@/components/auth/auth-shell";
import { InscriptionForm } from "@/components/auth/inscription-form";

export default function InscriptionPage() {
  return (
    <AuthShell
      title="Créer votre page artisan"
      description="14 jours d'essai gratuit, sans carte bancaire."
      wide
    >
      <InscriptionForm />
    </AuthShell>
  );
}
