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
import { enregistrerMateriel } from "@/app/dashboard/outils/actions";
import type { Tables } from "@/lib/types/database";

export function MaterielFormDialog({ article }: { article?: Tables<"materiel_catalogue"> }) {
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await enregistrerMateriel(formData);
        setOpen(false);
        toast.success(article ? "Article modifié" : "Article ajouté");
      } catch (err) {
        setErreur(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        size={article ? "sm" : "default"}
        variant={article ? "outline" : "default"}
        onClick={() => setOpen(true)}
      >
        {article ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
        {article ? "Modifier" : "Ajouter un article"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{article ? "Modifier l’article" : "Nouvel article du catalogue"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {article && <input type="hidden" name="id" value={article.id} />}
          <div className="space-y-1.5">
            <Label htmlFor="mat-designation">Désignation</Label>
            <Input id="mat-designation" name="designation" defaultValue={article?.designation} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mat-reference">Référence</Label>
              <Input id="mat-reference" name="reference" defaultValue={article?.reference ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-famille">Famille</Label>
              <Input id="mat-famille" name="famille" defaultValue={article?.famille ?? ""} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mat-unite">Unité</Label>
              <Input id="mat-unite" name="unite" defaultValue={article?.unite ?? "u"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-prix">Prix d’achat (€)</Label>
              <Input
                id="mat-prix"
                name="prixAchat"
                type="number"
                step="0.01"
                defaultValue={article?.prix_achat_cents ? (article.prix_achat_cents / 100).toFixed(2) : ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-coefficient">Coefficient de vente</Label>
              <Input
                id="mat-coefficient"
                name="coefficient"
                type="number"
                step="0.01"
                defaultValue={article?.coefficient ?? 1.4}
              />
            </div>
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
