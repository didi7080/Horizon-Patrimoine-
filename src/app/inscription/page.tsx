import { AuthShell } from "@/components/auth/auth-shell";
import { InscriptionForm } from "@/components/auth/inscription-form";

export default async function InscriptionPage({ searchParams }: PageProps<"/inscription">) {
  const params = await searchParams;
  const parrain = typeof params.parrain === "string" ? params.parrain : undefined;

  return (
    <AuthShell
      title="Créer votre page artisan"
      description="14 jours d'essai gratuit, sans carte bancaire."
      wide
    >
      <InscriptionForm parrain={parrain} />
    </AuthShell>
  );
}
