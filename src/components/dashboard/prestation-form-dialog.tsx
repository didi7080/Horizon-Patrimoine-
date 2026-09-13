"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { enregistrerPrestation } from "@/app/dashboard/actions";
import type { Tables } from "@/lib/types/database";

type Salarie = Pick<Tables<"salaries">, "id" | "nom" | "fonction">;

export function PrestationFormDialog({
  salaries,
  prestation,
  salarieIdsAssignes = [],
}: {
  salaries: Salarie[];
  prestation?: Tables<"prestations">;
  salarieIdsAssignes?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await enregistrerPrestation(formData);
        setOpen(false);
        toast.success(prestation ? "Prestation modifiée" : "Prestation créée");
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={prestation ? "sm" : "default"}
        variant={prestation ? "outline" : "default"}
        onClick={() => setOpen(true)}
      >
        {prestation ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
        {prestation ? "Modifier" : "Ajouter une prestation"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{prestation ? "Modifier la prestation" : "Nouvelle prestation"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {prestation && <input type="hidden" name="id" value={prestation.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" defaultValue={prestation?.nom} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={prestation?.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dureeMin">Durée (minutes)</Label>
              <Input
                id="dureeMin"
                name="dureeMin"
                type="number"
                min={5}
                step={5}
                defaultValue={prestation?.duree_min ?? 60}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prix">Prix (€, vide = sur devis)</Label>
              <Input
                id="prix"
                name="prix"
                type="number"
                min={0}
                step="0.01"
                defaultValue={
                  prestation?.prix_cents !== null && prestation?.prix_cents !== undefined
                    ? prestation.prix_cents / 100
                    : ""
                }
              />
            </div>
          </div>
          {salaries.length > 0 && (
            <div className="space-y-1.5">
              <Label>Réalisée par</Label>
              <div className="flex flex-wrap gap-2">
                {salaries.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-light/60"
                  >
                    <input
                      type="checkbox"
                      name="salarieIds"
                      value={s.id}
                      defaultChecked={salarieIdsAssignes.includes(s.id)}
                      className="accent-brand"
                    />
                    {s.nom}
                  </label>
                ))}
              </div>
            </div>
          )}

          {erreur && <p className="text-sm text-danger">{erreur}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
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
