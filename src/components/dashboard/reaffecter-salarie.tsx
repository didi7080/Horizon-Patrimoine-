"use client";

import { useTransition } from "react";
import { UserCog } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Resultat = { ok: true } | { ok: false; erreur: string };

export function ReaffecterSalarie({
  salarieActuelId,
  salariesDisponibles,
  onChange,
}: {
  salarieActuelId: string | null;
  salariesDisponibles: { id: string; nom: string }[];
  onChange: (salarieId: string) => Promise<Resultat>;
}) {
  const [pending, startTransition] = useTransition();

  if (salariesDisponibles.length === 0) return null;

  function changer(valeur: string) {
    startTransition(async () => {
      const resultat = await onChange(valeur);
      if (!resultat.ok) toast.error(resultat.erreur);
      else toast.success("Rendez-vous réaffecté.");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <UserCog className="size-3.5 shrink-0 text-muted-foreground" />
      <Select value={salarieActuelId ?? undefined} onValueChange={changer} disabled={pending}>
        <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-transparent px-1.5 text-xs shadow-none hover:bg-surface">
          <SelectValue placeholder="Réaffecter…" />
        </SelectTrigger>
        <SelectContent>
          {salariesDisponibles.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
