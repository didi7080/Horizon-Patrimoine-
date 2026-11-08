"use client";

import { useTransition } from "react";
import { Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demarrerConnexionStripe } from "@/app/dashboard/paiements/actions";

export function ConnecterStripeBouton({ children }: { children: React.ReactNode }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        const { url } = await demarrerConnexionStripe();
        window.location.href = url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button type="button" onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Landmark className="size-4" />}
      {children}
    </Button>
  );
}
