"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { enregistrerNotesClient } from "@/app/dashboard/actions";

export function ClientNotes({ clientId, notes }: { clientId: string; notes: string | null }) {
  const [valeur, setValeur] = useState(notes ?? "");
  const [pending, startTransition] = useTransition();

  function enregistrer() {
    startTransition(async () => {
      try {
        await enregistrerNotesClient(clientId, valeur);
        toast.success("Notes enregistrées");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        placeholder="Notes internes sur ce client…"
        className="min-h-16 text-sm"
      />
      {valeur !== (notes ?? "") && (
        <Button size="sm" onClick={enregistrer} disabled={pending}>
          {pending && <Loader2 className="size-3.5 animate-spin" />}
          Enregistrer
        </Button>
      )}
    </div>
  );
}
