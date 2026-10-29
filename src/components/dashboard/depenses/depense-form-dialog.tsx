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
import { creerDepense } from "@/app/dashboard/depenses/actions";
import { CATEGORIES_DEPENSE } from "@/lib/depenses/types";

export function DepenseFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const aujourdHui = new Date().toISOString().slice(0, 10);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await creerDepense(formData);
        setOpen(false);
        router.refresh();
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Nouvelle dépense
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="depense-date">Date</Label>
              <Input id="depense-date" name="date" type="date" defaultValue={aujourdHui} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="depense-montant">Montant TTC (€)</Label>
              <Input id="depense-montant" name="montant" type="number" min="0" step="0.01" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="depense-categorie">Catégorie</Label>
            <Input id="depense-categorie" name="categorie" list="categories-depense" required />
            <datalist id="categories-depense">
              {CATEGORIES_DEPENSE.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="depense-description">Description</Label>
            <Input id="depense-description" name="description" placeholder="Ex. Achat de peinture chez..." />
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
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
