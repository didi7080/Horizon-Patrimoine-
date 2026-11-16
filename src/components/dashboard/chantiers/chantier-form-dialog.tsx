"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { creerChantier, mettreAJourChantier } from "@/app/dashboard/chantiers/actions";
import type { Tables } from "@/lib/types/database";

export function ChantierFormDialog({
  clients,
  clientIdFixe,
  chantier,
}: {
  clients: { id: string; nom: string }[];
  clientIdFixe?: string;
  chantier?: Tables<"chantiers">;
}) {
  const [open, setOpen] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const resultat = chantier ? await mettreAJourChantier(chantier.id, formData) : await creerChantier(formData);
      if (!resultat.ok) {
        setErreur(resultat.erreur);
        return;
      }
      setOpen(false);
      toast.success(chantier ? "Chantier modifié" : "Chantier créé");
      if (!chantier && "id" in resultat) router.push(`/dashboard/chantiers/${resultat.id}`);
      else router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant={chantier ? "outline" : "default"} size={chantier ? "sm" : "default"} onClick={() => setOpen(true)}>
        {chantier ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
        {chantier ? "Modifier" : "Nouveau chantier"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chantier ? "Modifier le chantier" : "Nouveau chantier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {chantier || clientIdFixe ? (
            <input type="hidden" name="clientId" value={clientIdFixe ?? chantier?.client_id} />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="clientId">Client</Label>
              <Select name="clientId" required>
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="titre">Titre du chantier</Label>
            <Input id="titre" name="titre" placeholder="Ex. Rénovation salle de bain" defaultValue={chantier?.titre} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" name="adresse" defaultValue={chantier?.adresse ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateDebutPrevue">Début prévu</Label>
              <Input id="dateDebutPrevue" name="dateDebutPrevue" type="date" defaultValue={chantier?.date_debut_prevue ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dateFinPrevue">Fin prévue</Label>
              <Input id="dateFinPrevue" name="dateFinPrevue" type="date" defaultValue={chantier?.date_fin_prevue ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={chantier?.notes ?? ""} />
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
              {chantier ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
