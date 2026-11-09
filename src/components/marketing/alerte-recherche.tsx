"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, CheckCircle2, MapPin, SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { creerAlerteRecherche } from "@/app/recherche/actions";

export function AlerteRecherche({ metier, ville }: { metier?: string; ville?: string }) {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [pending, startTransition] = useTransition();

  const libelleMetier = metier ?? "artisan";
  const lienGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [libelleMetier, ville].filter(Boolean).join(" "),
  )}`;

  function envoyer() {
    if (!metier) return;
    startTransition(async () => {
      const resultat = await creerAlerteRecherche(metier, ville ?? "", email);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      setEnvoye(true);
      toast.success("C'est noté, vous serez prévenu(e) !");
    });
  }

  return (
    <Card className="flex flex-col items-center gap-4 rounded-xl border-dashed py-12 text-center">
      <SearchX className="size-8 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">Aucun artisan ne correspond à cette recherche</p>
        <p className="mt-1 text-sm text-muted">Essayez un autre métier ou une autre ville.</p>
      </div>

      {metier && (
        <>
          {envoye ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> Vous serez prévenu(e) par e-mail dès qu’un {libelleMetier.toLowerCase()} s’inscrit
              {ville ? ` près de ${ville}` : ""}.
            </p>
          ) : (
            <div className="flex w-full max-w-sm flex-col items-center gap-2 px-4 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre e-mail"
                className="bg-background"
              />
              <Button type="button" onClick={envoyer} disabled={pending || !email} className="w-full shrink-0 sm:w-auto">
                <Bell className="size-3.5" /> Me prévenir
              </Button>
            </div>
          )}

          <Button asChild variant="outline" size="sm">
            <a href={lienGoogleMaps} target="_blank" rel="noopener noreferrer">
              <MapPin className="size-3.5" /> Chercher sur Google Maps
            </a>
          </Button>
        </>
      )}
    </Card>
  );
}
