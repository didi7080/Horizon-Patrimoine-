"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creerModuleDepuisModele } from "@/app/dashboard/outils/actions";

export function CreerDepuisModeleBouton({ nomModele }: { nomModele: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        await creerModuleDepuisModele(nomModele);
        toast.success("Module ajouté — vous pouvez le personnaliser.");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      Ajouter ce modèle
    </Button>
  );
}
