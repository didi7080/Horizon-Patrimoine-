"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglerMaterielActif } from "@/app/dashboard/outils/actions";

export function ToggleMaterielActifBouton({ id, actif }: { id: string; actif: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const resultat = await togglerMaterielActif(id, !actif);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="ghost" type="button" onClick={onClick} disabled={pending}>
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {actif ? "Masquer" : "Réactiver"}
    </Button>
  );
}
