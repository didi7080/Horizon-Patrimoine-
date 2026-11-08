"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientNotes } from "@/components/dashboard/client-notes";
import { supprimerOuAnonymiserClient } from "@/app/dashboard/clients/actions";
import type { Tables } from "@/lib/types/database";

export function ClientRow({ client, nbRdv }: { client: Tables<"clients">; nbRdv: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function supprimer() {
    if (
      !window.confirm(
        `Supprimer ${client.nom} ? S'il a des rendez-vous ou documents liés, ses coordonnées seront anonymisées plutôt que supprimées — l'historique de facturation est conservé.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        const { action } = await supprimerOuAnonymiserClient(client.id);
        toast.success(action === "supprime" ? "Client supprimé." : "Client anonymisé (il avait un historique conservé).");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{client.nom}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
            {client.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" /> {client.email}
              </span>
            )}
            {client.telephone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {client.telephone}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">
            {nbRdv} rendez-vous
          </span>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            Détails
          </Button>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{client.nom}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {client.email && (
              <p className="flex items-center gap-2 text-foreground">
                <Mail className="size-4 text-muted" /> {client.email}
              </p>
            )}
            {client.telephone && (
              <p className="flex items-center gap-2 text-foreground">
                <Phone className="size-4 text-muted" /> {client.telephone}
              </p>
            )}
            {client.adresse && (
              <p className="flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-muted" /> {client.adresse}
              </p>
            )}
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notes internes
            </p>
            <ClientNotes clientId={client.id} notes={client.notes} />
          </div>
          <div className="border-t border-border pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={supprimer} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 text-destructive" />}
              Supprimer ce client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
