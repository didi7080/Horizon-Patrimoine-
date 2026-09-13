"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { enregistrerSalarie } from "@/app/dashboard/actions";
import type { Tables } from "@/lib/types/database";

const COULEURS = ["#2563eb", "#db2777", "#f59e0b", "#10b981", "#7c3aed", "#dc2626"];

export function SalarieFormDialog({ salarie }: { salarie?: Tables<"salaries"> }) {
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [couleur, setCouleur] = useState(salarie?.couleur ?? COULEURS[0]);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("couleur", couleur);
    startTransition(async () => {
      try {
        await enregistrerSalarie(formData);
        setOpen(false);
        toast.success(salarie ? "Membre modifié" : "Membre ajouté");
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={salarie ? "sm" : "default"}
        variant={salarie ? "outline" : "default"}
        onClick={() => setOpen(true)}
      >
        {salarie ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
        {salarie ? "Modifier" : "Ajouter un membre"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{salarie ? "Modifier le membre" : "Nouveau membre de l'équipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {salarie && <input type="hidden" name="id" value={salarie.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" defaultValue={salarie?.nom} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fonction">Fonction</Label>
            <Input id="fonction" name="fonction" defaultValue={salarie?.fonction ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Couleur dans l’agenda</Label>
            <div className="flex gap-2">
              {COULEURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleur(c)}
                  className="size-7 rounded-full ring-offset-2 transition-shadow"
                  style={{ backgroundColor: c, boxShadow: couleur === c ? `0 0 0 2px ${c}` : undefined }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

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
