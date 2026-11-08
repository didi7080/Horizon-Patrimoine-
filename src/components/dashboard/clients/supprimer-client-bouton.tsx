"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supprimerOuAnonymiserClient } from "@/app/dashboard/clients/actions";

export function SupprimerClientBouton({ clientId, clientNom }: { clientId: string; clientNom: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !window.confirm(
        `Supprimer ${clientNom} ? S'il a des rendez-vous ou documents liés, ses coordonnées seront anonymisées plutôt que supprimées — l'historique de facturation est conservé.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const { action } = await supprimerOuAnonymiserClient(clientId);
        if (action === "supprime") {
          toast.success("Client supprimé.");
          router.push("/dashboard/clients");
        } else {
          toast.success("Client anonymisé (il avait un historique conservé).");
          router.refresh();
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={pending} className="text-destructive">
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Supprimer ce client
    </Button>
  );
}
