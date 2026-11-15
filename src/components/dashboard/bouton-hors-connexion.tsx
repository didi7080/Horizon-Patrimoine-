"use client";

import { Button } from "@/components/ui/button";
import { useHorsConnexion } from "@/lib/hooks/hors-connexion";

export function BoutonHorsConnexion(props: React.ComponentProps<typeof Button>) {
  const horsConnexion = useHorsConnexion();

  return (
    <Button
      {...props}
      disabled={props.disabled || horsConnexion}
      title={horsConnexion ? "Indisponible hors connexion" : props.title}
    />
  );
}
