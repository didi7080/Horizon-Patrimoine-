"use client";

import { useState, useTransition } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rejoindreListeAttenteAction } from "@/app/e/[slug]/reserver/[prestationId]/actions";

export function ListeAttenteForm({
  entrepriseId,
  prestationId,
}: {
  entrepriseId: string;
  prestationId: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [montageA] = useState(() => Date.now());
  const [siteWeb, setSiteWeb] = useState("");

  if (envoye) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-success-light px-4 py-3 text-sm text-success">
        <CheckCircle2 className="size-4" /> Vous serez prévenu dès qu’un créneau se libère.
      </p>
    );
  }

  if (!ouvert) {
    return (
      <Button variant="outline" onClick={() => setOuvert(true)}>
        <BellRing className="size-4" /> Être prévenu si une place se libère
      </Button>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("entreprise_id", entrepriseId);
    formData.set("prestation_id", prestationId);
    formData.set("site_web", siteWeb);
    formData.set("rendu_a", String(montageA));
    startTransition(async () => {
      const resultat = await rejoindreListeAttenteAction(null, formData);
      if (resultat?.error) {
        setErreur(resultat.error);
        return;
      }
      setEnvoye(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm font-medium text-foreground">Être prévenu si une place se libère</p>
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input
          name="site_web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={siteWeb}
          onChange={(e) => setSiteWeb(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="la-nom">Nom</Label>
          <Input id="la-nom" name="nom" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="la-email">E-mail</Label>
          <Input id="la-email" name="email" type="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="la-tel">Téléphone</Label>
          <Input id="la-tel" name="tel" type="tel" />
        </div>
      </div>
      {erreur && <p className="text-sm text-danger">{erreur}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        M’inscrire sur la liste d’attente
      </Button>
    </form>
  );
}
