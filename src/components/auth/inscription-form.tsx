"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { METIERS } from "@/lib/metiers";
import { inscriptionAction, type EtatFormulaire } from "@/app/inscription/actions";

export function InscriptionForm() {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(inscriptionAction, null);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Votre compte
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Votre nom</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Votre téléphone</Label>
            <Input id="phone" name="phone" type="tel" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail professionnel</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motDePasse">Mot de passe</Label>
          <Input
            id="motDePasse"
            name="motDePasse"
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Votre entreprise
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="nomEntreprise">Nom de l’entreprise</Label>
          <Input id="nomEntreprise" name="nomEntreprise" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="metier">Métier</Label>
            <Select name="metier">
              <SelectTrigger id="metier">
                <SelectValue placeholder="Choisir un métier" />
              </SelectTrigger>
              <SelectContent>
                {METIERS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nbSalaries">Nombre de personnes dans l’équipe</Label>
            <Input id="nbSalaries" name="nbSalaries" type="number" min={1} defaultValue={1} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" name="ville" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codePostal">Code postal</Label>
            <Input id="codePostal" name="codePostal" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" name="adresse" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telephone">Téléphone de l’entreprise</Label>
          <Input id="telephone" name="telephone" type="tel" />
        </div>
      </div>

      {etat?.error && <p className="text-sm text-danger">{etat.error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={enCours}>
        {enCours && <Loader2 className="size-4 animate-spin" />}
        Créer mon compte gratuitement
      </Button>

      <p className="text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
