"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demarrerAbonnement, ouvrirPortailFacturation } from "@/app/dashboard/facturation/actions";
import type { Plan } from "@/lib/stripe";

export function AbonnementBouton({
  action,
  plan,
  children,
  size,
  variant,
  className,
}: {
  action: "demarrer" | "portail";
  plan?: Plan;
  children: React.ReactNode;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        const resultat = action === "portail" ? await ouvrirPortailFacturation() : await demarrerAbonnement(plan);
        window.location.href = resultat.url;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Button type="button" onClick={onClick} disabled={pending} size={size} variant={variant} className={className}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
