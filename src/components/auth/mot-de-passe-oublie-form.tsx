"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function MotDePasseOublieForm() {
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) {
      setErreur("Merci de renseigner votre e-mail.");
      return;
    }

    setErreur(null);
    setEnCours(true);
    // Envoyé depuis le navigateur (et non une Server Action) : c'est ce navigateur qui doit
    // garder la trace de la demande (cookie du vérificateur PKCE) pour pouvoir, plus tard,
    // terminer la réinitialisation quand on clique sur le lien reçu par e-mail.
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reinitialiser-mot-de-passe`,
    });
    setEnCours(false);

    if (error) {
      setErreur(
        error.message.includes("rate limit")
          ? "Trop de demandes pour le moment. Réessayez dans quelques minutes."
          : "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard.",
      );
      return;
    }

    setEnvoye(true);
  }

  if (envoye) {
    return (
      <p className="text-sm text-foreground">
        Si un compte existe avec cet e-mail, vous allez recevoir un lien pour réinitialiser votre mot de passe.
        Ouvrez-le dans ce même navigateur.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail professionnel</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {erreur && <p className="text-sm text-danger">{erreur}</p>}

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
