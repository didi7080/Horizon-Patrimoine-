"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackagePlus } from "lucide-react";
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
import { ajusterStockDepot } from "@/app/dashboard/outils/stock-actions";

export function AjusterStockDialog({ materielId, designation }: { materielId: string; designation: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantite, setQuantite] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = Number(quantite);
    if (!Number.isFinite(q) || q === 0) {
      setErreur("Entrez une quantité (positive pour une réception, négative pour une correction).");
      return;
    }
    startTransition(async () => {
      const resultat = await ajusterStockDepot(materielId, q);
      if (!resultat.ok) {
        setErreur(resultat.erreur);
        return;
      }
      toast.success("Stock dépôt mis à jour.");
      setOpen(false);
      setQuantite("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PackagePlus className="size-3.5" /> Ajuster le stock
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuster le stock dépôt — {designation}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quantite-ajustement">Quantité</Label>
            <Input
              id="quantite-ajustement"
              type="number"
              step="any"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Ex. 50 (réception) ou -2 (correction)"
            />
            <p className="text-xs text-muted-foreground">
              Positive pour une réception fournisseur, négative pour corriger un écart d’inventaire.
            </p>
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
