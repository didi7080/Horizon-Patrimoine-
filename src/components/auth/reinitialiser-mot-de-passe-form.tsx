"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reinitialiserMotDePasseAction, type EtatFormulaire } from "@/app/reinitialiser-mot-de-passe/actions";

export function ReinitialiserMotDePasseForm() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(reinitialiserMotDePasseAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="motDePasse">Nouveau mot de passe</Label>
        <Input id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      {etat?.error && <p className="text-sm text-danger">{etat.error}</p>}

      <Button type="submit" className="w-full" disabled={enCours}>
        {enCours && <Loader2 className="size-4 animate-spin" />}
        Mettre à jour le mot de passe
      </Button>
    </form>
  );
}
