"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoutonSupprimer({
  confirmation,
  action,
}: {
  confirmation: string;
  action: () => Promise<{ ok: true } | { ok: false; erreur: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(confirmation)) return;
    startTransition(async () => {
      const resultat = await action();
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 text-destructive" />}
    </Button>
  );
}
