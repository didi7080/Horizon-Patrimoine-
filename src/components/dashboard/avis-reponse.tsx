"use client";

import { useState, useTransition } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { repondreAvis } from "@/app/dashboard/actions";

export function AvisReponse({ avisId, reponse }: { avisId: string; reponse: string | null }) {
  const [enEdition, setEnEdition] = useState(false);
  const [valeur, setValeur] = useState(reponse ?? "");
  const [pending, startTransition] = useTransition();

  function enregistrer() {
    startTransition(async () => {
      const resultat = await repondreAvis(avisId, valeur);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      toast.success(valeur.trim() ? "Réponse publiée" : "Réponse retirée");
      setEnEdition(false);
    });
  }

  if (!enEdition) {
    return reponse ? (
      <div className="mt-2 rounded-lg bg-surface p-3">
        <p className="text-xs font-medium text-muted-foreground">Votre réponse (visible publiquement)</p>
        <p className="mt-1 text-sm text-foreground">{reponse}</p>
        <Button size="sm" variant="ghost" className="mt-1" onClick={() => setEnEdition(true)}>
          Modifier
        </Button>
      </div>
    ) : (
      <Button size="sm" variant="outline" className="mt-2" onClick={() => setEnEdition(true)}>
        <MessageSquare className="size-3.5" /> Répondre
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        placeholder="Votre réponse, visible publiquement sous cet avis…"
        className="min-h-16 text-sm"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={enregistrer} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Publier la réponse
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setValeur(reponse ?? ""); setEnEdition(false); }} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
