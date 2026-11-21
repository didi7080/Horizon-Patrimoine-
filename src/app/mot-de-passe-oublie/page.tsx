import { AuthShell } from "@/components/auth/auth-shell";
import { MotDePasseOublieForm } from "@/components/auth/mot-de-passe-oublie-form";

export default async function MotDePasseOubliePage({
  searchParams,
}: PageProps<"/mot-de-passe-oublie">) {
  const params = await searchParams;
  const lienInvalide = params.erreur === "lien_invalide";

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indiquez votre e-mail, on vous envoie un lien pour le réinitialiser."
    >
      {lienInvalide && (
        <p className="mb-4 rounded-md bg-danger-light p-3 text-sm text-danger">
          Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau ci-dessous.
        </p>
      )}
      <MotDePasseOublieForm />
    </AuthShell>
  );
}
