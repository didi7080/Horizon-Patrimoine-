"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changerMotDePasse } from "@/app/dashboard/actions";

export function ChangerMotDePasseForm() {
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const motDePasse = String(formData.get("motDePasse") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (motDePasse.length < 8) {
      setErreur("8 caractères minimum.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setErreur(null);
    startTransition(async () => {
      const resultat = await changerMotDePasse(motDePasse);
      if (!resultat.ok) {
        setErreur(resultat.erreur);
        return;
      }
      toast.success("Mot de passe mis à jour.");
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rgl-motDePasse">Nouveau mot de passe</Label>
          <Input id="rgl-motDePasse" name="motDePasse" type="password" minLength={8} autoComplete="new-password" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rgl-confirmation">Confirmer</Label>
          <Input id="rgl-confirmation" name="confirmation" type="password" minLength={8} autoComplete="new-password" required />
        </div>
      </div>
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Changer le mot de passe
      </Button>
    </form>
  );
}
