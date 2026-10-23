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
  action: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(confirmation)) return;
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 text-destructive" />}
    </Button>
  );
}
