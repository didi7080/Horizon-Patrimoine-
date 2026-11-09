"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validerDepense, refuserDepense } from "@/app/dashboard/depenses/actions";

export function ValidationDepenseBoutons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function traiter(action: (id: string) => Promise<{ ok: true } | { ok: false; erreur: string }>) {
    startTransition(async () => {
      const resultat = await action(id);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="sm" onClick={() => traiter(validerDepense)} disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Valider
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => traiter(refuserDepense)} disabled={pending}>
        <X className="size-3.5" />
        Refuser
      </Button>
    </div>
  );
}
