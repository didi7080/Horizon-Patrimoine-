"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { creerDocument } from "@/app/dashboard/documents/actions";
import type { TypeDocument } from "@/lib/documents/types";

const classeSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

type ClientExistant = { id: string; nom: string };

export function DocumentFormDialog({ type, clients }: { type: TypeDocument; clients: ClientExistant[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const libelle = type === "devis" ? "devis" : "facture";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const id = await creerDocument(type, formData);
        setOpen(false);
        router.push(`/dashboard/documents/${id}`);
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant={type === "devis" ? "outline" : "default"} onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nouveau {libelle}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau {libelle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {clients.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor={`${type}-client-existant`}>Client</Label>
              <select
                id={`${type}-client-existant`}
                name="clientId"
                className={classeSelect}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">— Nouveau client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!clientId && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor={`${type}-client-nom`}>Nom du client</Label>
                <Input id={`${type}-client-nom`} name="clientNom" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${type}-client-adresse`}>Adresse</Label>
                <Input id={`${type}-client-adresse`} name="clientAdresse" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`${type}-client-tel`}>Téléphone</Label>
                  <Input id={`${type}-client-tel`} name="clientTelephone" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${type}-client-email`}>E-mail</Label>
                  <Input id={`${type}-client-email`} name="clientEmail" type="email" />
                </div>
              </div>
              {clients.length > 0 && (
                <p className="text-xs text-muted">Ce nouveau client sera automatiquement ajouté à votre fichier clients.</p>
              )}
            </>
          )}
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Créer le {libelle}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
