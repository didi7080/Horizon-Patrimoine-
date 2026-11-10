"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { demarrerAbonnement, ouvrirPortailFacturation } from "@/app/dashboard/facturation/actions";
import type { Intervalle, Plan } from "@/lib/stripe";

export function AbonnementBouton({
  action,
  plan,
  intervalle = "mois",
  children,
  size,
  variant,
  className,
}: {
  action: "demarrer" | "portail";
  plan?: Plan;
  intervalle?: Intervalle;
  children: React.ReactNode;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const resultat = action === "portail" ? await ouvrirPortailFacturation() : await demarrerAbonnement(plan, intervalle);
      if (!resultat.ok) {
        toast.error(resultat.erreur);
        return;
      }
      window.location.href = resultat.url;
    });
  }

  return (
    <Button type="button" onClick={onClick} disabled={pending} size={size} variant={variant} className={className}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
