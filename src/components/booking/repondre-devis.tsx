"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const EN_ATTENTE = new Set(["brouillon", "envoye"]);

export function RepondreDevis({ token, statutInitial }: { token: string; statutInitial: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [statut, setStatut] = useState(statutInitial);
  const [enCours, setEnCours] = useState(false);

  async function repondre(accepter: boolean) {
    if (!accepter && !window.confirm("Confirmer le refus de ce devis ?")) return;
    setEnCours(true);
    const { error } = await supabase.rpc("repondre_devis_public", { p_token: token, p_accepter: accepter });
    setEnCours(false);
    if (error) {
      toast.error("Impossible d'enregistrer votre réponse", { description: error.message });
      return;
    }
    setStatut(accepter ? "accepte" : "refuse");
    toast.success(accepter ? "Devis accepté" : "Devis refusé");
  }

  if (statut === "accepte") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success bg-success-light p-4 text-success">
        <CheckCircle2 className="size-5 shrink-0" />
        <p className="font-medium">Vous avez accepté ce devis. L’artisan a été prévenu.</p>
      </div>
    );
  }

  if (statut === "refuse") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-4 text-muted">
        <XCircle className="size-5 shrink-0" />
        <p className="font-medium">Vous avez refusé ce devis. L’artisan a été prévenu.</p>
      </div>
    );
  }

  if (!EN_ATTENTE.has(statut)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={() => repondre(false)} disabled={enCours}>
        {enCours ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
        Je refuse ce devis
      </Button>
      <Button type="button" onClick={() => repondre(true)} disabled={enCours}>
        {enCours ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        J’accepte ce devis
      </Button>
    </div>
  );
}
