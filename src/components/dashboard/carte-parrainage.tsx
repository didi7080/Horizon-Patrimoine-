"use client";

import { useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CarteParrainage({ entrepriseId }: { entrepriseId: string }) {
  const [copie, setCopie] = useState(false);

  async function copierLien() {
    const lien = `${window.location.origin}/inscription?parrain=${entrepriseId}`;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      toast.success("Lien de parrainage copié");
      setTimeout(() => setCopie(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <Card className="space-y-3 p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Gift className="size-4 text-brand" /> Parrainez un autre artisan
      </p>
      <p className="text-sm text-muted">
        Partagez votre lien : vous recevez chacun un mois offert dès que l’artisan parrainé règle son premier
        abonnement.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={copierLien}>
        {copie ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} Copier mon lien de parrainage
      </Button>
    </Card>
  );
}
