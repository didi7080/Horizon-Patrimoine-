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
import { enregistrerEtude } from "@/app/dashboard/outils/actions";

const classeSelect =
  "flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20";

export function EtudeFormDialog({ modules }: { modules: { id: string; nom: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const id = await enregistrerEtude(formData);
        setOpen(false);
        if (id) router.push(`/dashboard/outils/etudes/${id}`);
        else router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nouvelle étude
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle étude</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="etude-titre">Titre</Label>
            <Input id="etude-titre" name="titre" placeholder="Ex. Devis M. Dupont — Chauffage" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="etude-module">Module de calcul</Label>
            <select id="etude-module" name="moduleId" className={classeSelect} defaultValue="">
              <option value="">Aucun pour le moment</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="etude-client-nom">Client</Label>
              <Input id="etude-client-nom" name="clientNom" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="etude-client-tel">Téléphone</Label>
              <Input id="etude-client-tel" name="clientTelephone" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="etude-client-adresse">Adresse</Label>
            <Input id="etude-client-adresse" name="clientAdresse" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="etude-client-email">E-mail</Label>
            <Input id="etude-client-email" name="clientEmail" type="email" />
          </div>
          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Créer l’étude
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
