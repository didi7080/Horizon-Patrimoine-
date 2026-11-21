"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motDePasseOublieAction, type EtatFormulaire } from "@/app/mot-de-passe-oublie/actions";

export function MotDePasseOublieForm() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(motDePasseOublieAction, null);

  if (etat?.envoye) {
    return (
      <p className="text-sm text-foreground">
        Si un compte existe avec cet e-mail, vous allez recevoir un lien pour réinitialiser votre mot de passe.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {etat?.error && <p className="text-sm text-danger">{etat.error}</p>}

      <Button type="submit" className="w-full" disabled={enCours}>
        {enCours && <Loader2 className="size-4 animate-spin" />}
        Envoyer le lien
      </Button>

      <p className="text-center text-sm text-muted">
        <Link href="/connexion" className="font-medium text-brand hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
