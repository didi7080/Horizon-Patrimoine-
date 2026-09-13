"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connexionAction, type EtatFormulaire } from "@/app/connexion/actions";

export function ConnexionForm() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(connexionAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="motDePasse">Mot de passe</Label>
        </div>
        <Input id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required />
      </div>

      {etat?.error && <p className="text-sm text-danger">{etat.error}</p>}

      <Button type="submit" className="w-full" disabled={enCours}>
        {enCours && <Loader2 className="size-4 animate-spin" />}
        Se connecter
      </Button>

      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand hover:underline">
          Créer mon compte artisan
        </Link>
      </p>
    </form>
  );
}
