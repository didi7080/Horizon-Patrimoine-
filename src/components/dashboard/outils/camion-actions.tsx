"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PackageMinus, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { prendrePieceCamion, reapprovisionnerCamion } from "@/app/dashboard/outils/stock-actions";

type Article = { id: string; designation: string; unite: string };

function FormulairePiece({
  titre,
  description,
  icone,
  articles,
  salarieId,
  action,
}: {
  titre: string;
  description: string;
  icone: React.ReactNode;
  articles: Article[];
  salarieId: string;
  action: (materielId: string, salarieId: string, quantite: number) => Promise<{ ok: boolean; erreur?: string }>;
}) {
  const router = useRouter();
  const [materielId, setMaterielId] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!materielId) {
      toast.error("Choisissez une pièce.");
      return;
    }
    const q = Number(quantite);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Quantité invalide.");
      return;
    }
    startTransition(async () => {
      const resultat = await action(materielId, salarieId, q);
      if (!resultat.ok) {
        toast.error(resultat.erreur ?? "Une erreur est survenue.");
        return;
      }
      toast.success("Enregistré.");
      setMaterielId("");
      setQuantite("1");
      router.refresh();
    });
  }

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        {icone}
        <h2 className="font-medium text-foreground">{titre}</h2>
      </div>
      <p className="text-sm text-muted">{description}</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label>Pièce</Label>
          <select
            value={materielId}
            onChange={(e) => setMaterielId(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-border-strong bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
          >
            <option value="">Choisir une pièce…</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>
                {a.designation} ({a.unite})
              </option>
            ))}
          </select>
        </div>
        <div className="w-full space-y-1.5 sm:w-28">
          <Label>Quantité</Label>
          <Input type="number" min="0" step="any" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : icone}
          Valider
        </Button>
      </form>
    </Card>
  );
}

export function PrendrePieceForm({ articles, salarieId }: { articles: Article[]; salarieId: string }) {
  return (
    <FormulairePiece
      titre="J'ai pris une pièce dans mon camion"
      description="Pour un chantier en cours — ça décompte votre stock camion."
      icone={<PackageMinus className="size-4 text-brand" />}
      articles={articles}
      salarieId={salarieId}
      action={prendrePieceCamion}
    />
  );
}

export function ReapprovisionnerForm({ articles, salarieId }: { articles: Article[]; salarieId: string }) {
  return (
    <FormulairePiece
      titre="Je recharge mon camion depuis le dépôt"
      description="Décompte le stock du dépôt et recharge votre camion."
      icone={<PackagePlus className="size-4 text-brand" />}
      articles={articles}
      salarieId={salarieId}
      action={reapprovisionnerCamion}
    />
  );
}
